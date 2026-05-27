import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { type Payment } from '@admin-platform/database';
import { PaymentStatus, PaymentGatewayProvider, Role } from '@admin-platform/types';
import {
  EVENT_SOURCE,
  DETAIL_TYPE,
  type PaymentHeldEvent,
  type PaymentReleasedEvent,
} from '@admin-platform/events';
import { LoggerService } from '../common/logger/logger.service';
import { EventsService } from '../common/events/events.service';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import { PaymentRepository, type PaymentWithOrder } from './payment.repository';
import { PeachGateway } from './gateways/peach.gateway';
import { FlutterwaveGateway } from './gateways/flutterwave.gateway';
import { type InitiatePaymentDto } from './dto/initiate-payment.dto';
import { type PeachWebhookDto } from './dto/peach-webhook.dto';
import { type FlutterwaveWebhookDto } from './dto/flutterwave-webhook.dto';
import { type OrderCompletedInternalDto, type OrderCancelledInternalDto } from './dto/internal-event.dto';

/**
 * Commission rate taken by Camluk Technologies.
 * Override with COMMISSION_RATE_PERCENT env var (integer %).
 */
const COMMISSION_RATE_PERCENT = parseInt(process.env['COMMISSION_RATE_PERCENT'] ?? '8', 10);

/**
 * PaymentService — escrow-based payment business logic.
 *
 * Flow:
 *   1. Buyer initiates payment → PENDING, gateway checkout URL returned
 *   2. Buyer completes payment on gateway → webhook → HELD, PaymentHeld event
 *   3. Order delivered → internal webhook → RELEASED, PaymentReleased event(s)
 *   4. Order cancelled with held payment → internal webhook → REFUNDED
 *
 * Commission: COMMISSION_RATE_PERCENT% of order totalValue, taken at hold time.
 * Factory payout = totalValue - commissionAmount.
 */
@Injectable()
export class PaymentService {
  private static readonly CONTEXT = 'PaymentService';

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly peachGateway: PeachGateway,
    private readonly flutterwaveGateway: FlutterwaveGateway,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────────

  async getPaymentByOrder(orderId: string, actor: JwtPayload): Promise<PaymentWithOrder> {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundException(`No payment found for order ${orderId}`);
    this.assertBuyerOrAdmin(payment.order.buyerId, actor);
    return payment;
  }

  // ── Initiation ─────────────────────────────────────────────────────────────

  async initiatePayment(dto: InitiatePaymentDto, actor: JwtPayload): Promise<{
    payment: Payment;
    checkoutUrl: string;
  }> {
    // Fetch the order to validate it's PLACED and get totalValue
    const existing = await this.paymentRepository.findByOrderId(dto.orderId);
    if (existing && existing.status !== PaymentStatus.FAILED) {
      throw new ConflictException(
        `A payment already exists for order ${dto.orderId} with status '${existing.status}'`,
      );
    }

    // Read order directly from the shared DB.
    // In a fully isolated microservices deployment this would be an HTTP call to orders-service.
    const order = existing?.order ?? await this.paymentRepository.findOrderById(dto.orderId);
    if (!order) throw new NotFoundException(`Order ${dto.orderId} not found`);

    if (order.status !== 'PLACED') {
      throw new ConflictException(
        `Order must be in PLACED status to initiate payment (current: '${order.status}')`,
      );
    }

    this.assertBuyerOrAdmin(order.buyerId, actor);

    // ── Calculate commission ──────────────────────────────────────────────────
    const amount           = order.totalValue;
    const commissionAmount = Math.round(amount * COMMISSION_RATE_PERCENT / 100);
    const factoryPayout    = amount - commissionAmount;

    const payment = await this.paymentRepository.create({
      orderId:          dto.orderId,
      amount,
      commissionAmount,
      factoryPayout,
      currency:         order.currency,
      gatewayProvider:  dto.gatewayProvider,
    });

    // ── Create gateway session ────────────────────────────────────────────────
    let checkoutUrl: string;

    if (dto.gatewayProvider === PaymentGatewayProvider.PEACH_PAYMENTS) {
      const session = await this.peachGateway.createCheckoutSession(
        payment.id, amount, order.currency,
      );
      checkoutUrl = session.checkoutUrl;
    } else {
      const session = await this.flutterwaveGateway.createPaymentLink(
        payment.id, amount, order.currency,
      );
      checkoutUrl = session.checkoutUrl;
    }

    this.logger.log(
      `Payment initiated: ${payment.id} for order ${dto.orderId} via ${dto.gatewayProvider}`,
      PaymentService.CONTEXT,
    );

    return { payment, checkoutUrl };
  }

  // ── Gateway webhooks ───────────────────────────────────────────────────────

  async processPeachWebhook(
    rawBody: Buffer,
    headers: Record<string, string | undefined>,
    dto: PeachWebhookDto,
  ): Promise<void> {
    // Validate signature
    if (process.env['NODE_ENV'] === 'production') {
      const valid = this.peachGateway.validateWebhookSignature(rawBody, headers);
      if (!valid) {
        this.logger.warn('Peach webhook signature validation failed', PaymentService.CONTEXT);
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const payment = await this.paymentRepository.findById(dto.merchantTransactionId);
    if (!payment) {
      this.logger.warn(
        `Peach webhook: payment ${dto.merchantTransactionId} not found`,
        PaymentService.CONTEXT,
      );
      return; // Return 200 to prevent Peach retrying
    }

    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.log(
        `Peach webhook: payment ${payment.id} already in status '${payment.status}' — skipping`,
        PaymentService.CONTEXT,
      );
      return;
    }

    const resultCode = dto['result.code'];

    if (this.peachGateway.isSuccessCode(resultCode)) {
      await this.holdPayment(payment, dto.id, dto as unknown as Record<string, unknown>);
    } else {
      await this.paymentRepository.markFailed(payment.id, dto as unknown as Record<string, unknown>);
      this.logger.warn(
        `Peach payment failed: ${payment.id} result code ${resultCode}`,
        PaymentService.CONTEXT,
      );
    }
  }

  async processFlutterwaveWebhook(
    rawBody: Buffer,
    headers: Record<string, string | undefined>,
    dto: FlutterwaveWebhookDto,
  ): Promise<void> {
    // Validate signature
    if (process.env['NODE_ENV'] === 'production') {
      const valid = this.flutterwaveGateway.validateWebhookSignature(rawBody, headers);
      if (!valid) {
        this.logger.warn('Flutterwave webhook signature validation failed', PaymentService.CONTEXT);
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    if (dto.event !== 'charge.completed') {
      this.logger.log(`Flutterwave webhook: ignoring event '${dto.event}'`, PaymentService.CONTEXT);
      return;
    }

    const { tx_ref, status, flw_ref } = dto.data;

    const payment = await this.paymentRepository.findById(tx_ref);
    if (!payment) {
      this.logger.warn(`Flutterwave webhook: payment ${tx_ref} not found`, PaymentService.CONTEXT);
      return;
    }

    if (payment.status !== PaymentStatus.PENDING) {
      this.logger.log(
        `Flutterwave webhook: payment ${payment.id} already '${payment.status}' — skipping`,
        PaymentService.CONTEXT,
      );
      return;
    }

    if (status === 'successful') {
      await this.holdPayment(
        payment,
        flw_ref ?? `FLW-${dto.data.id}`,
        dto.data as unknown as Record<string, unknown>,
      );
    } else {
      await this.paymentRepository.markFailed(payment.id, dto.data as unknown as Record<string, unknown>);
      this.logger.warn(
        `Flutterwave payment failed: ${payment.id} status ${status}`,
        PaymentService.CONTEXT,
      );
    }
  }

  // ── Internal event handlers (triggered by EventBridge-to-HTTP) ────────────

  validateInternalSecret(secret: string | undefined): void {
    const expected = process.env['INTERNAL_WEBHOOK_SECRET'] ?? 'dev-internal-secret-change-in-prod';
    if (secret !== expected) {
      throw new UnauthorizedException('Invalid internal webhook secret');
    }
  }

  async handleOrderCompleted(dto: OrderCompletedInternalDto): Promise<void> {
    const payment = await this.paymentRepository.findByOrderId(dto.orderId);
    if (!payment) {
      this.logger.warn(
        `handleOrderCompleted: no payment for order ${dto.orderId} — nothing to release`,
        PaymentService.CONTEXT,
      );
      return;
    }

    if (payment.status !== PaymentStatus.HELD) {
      this.logger.warn(
        `handleOrderCompleted: payment ${payment.id} is in status '${payment.status}' — expected HELD`,
        PaymentService.CONTEXT,
      );
      return;
    }

    await this.releaseEscrow(payment, dto.traceOrderId);
  }

  async handleOrderCancelled(dto: OrderCancelledInternalDto): Promise<void> {
    if (!dto.paymentWasHeld) {
      this.logger.log(
        `handleOrderCancelled: order ${dto.orderId} had no held payment — skipping refund`,
        PaymentService.CONTEXT,
      );
      return;
    }

    const payment = await this.paymentRepository.findByOrderId(dto.orderId);
    if (!payment) return;

    if (payment.status !== PaymentStatus.HELD) {
      this.logger.warn(
        `handleOrderCancelled: payment ${payment.id} is '${payment.status}' — cannot refund`,
        PaymentService.CONTEXT,
      );
      return;
    }

    await this.refundPayment(payment.id, dto.traceOrderId);
  }

  // ── Admin manual overrides ─────────────────────────────────────────────────

  async adminReleasePayment(id: string, actor: JwtPayload): Promise<Payment> {
    if (actor.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    if (payment.status !== PaymentStatus.HELD) {
      throw new ConflictException(`Payment ${id} must be HELD to release (current: '${payment.status}')`);
    }

    return this.releaseEscrow(payment, payment.order.traceOrderId);
  }

  async adminRefundPayment(id: string, actor: JwtPayload): Promise<Payment> {
    if (actor.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    if (payment.status !== PaymentStatus.HELD) {
      throw new ConflictException(`Payment ${id} must be HELD to refund (current: '${payment.status}')`);
    }

    return this.refundPayment(id, payment.order.traceOrderId);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Mark payment as HELD and publish PaymentHeld event.
   * Called by both Peach and Flutterwave webhook handlers.
   */
  private async holdPayment(
    payment: PaymentWithOrder,
    gatewayReference: string,
    gatewayResponse: Record<string, unknown>,
  ): Promise<Payment> {
    const held = await this.paymentRepository.hold(payment.id, {
      gatewayReference,
      gatewayResponse,
    });

    const event: PaymentHeldEvent = {
      source:     EVENT_SOURCE.PAYMENTS,
      detailType: DETAIL_TYPE.PAYMENT_HELD,
      detail: {
        orderId:          payment.orderId,
        orderNumber:      payment.order.orderNumber,
        paymentId:        payment.id,
        amount:           payment.amount,
        commissionAmount: payment.commissionAmount,
        factoryPayout:    payment.factoryPayout,
        currency:         payment.currency,
        gatewayProvider:  payment.gatewayProvider as PaymentGatewayProvider,
        gatewayReference,
        heldAt:           new Date().toISOString(),
        traceOrderId:     payment.order.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    this.logger.log(
      `Payment held: ${payment.id} for order ${payment.order.orderNumber} (${payment.currency} ${payment.amount / 100})`,
      PaymentService.CONTEXT,
    );

    return held;
  }

  /**
   * Release escrow to factories and publish one PaymentReleased event per sub-order.
   * Factory payout is split proportionally by units.
   */
  private async releaseEscrow(
    payment: PaymentWithOrder,
    traceOrderId: string,
  ): Promise<Payment> {
    const released = await this.paymentRepository.release(payment.id);

    const subOrders = payment.order.subOrders.filter((so) => so.status === 'COMPLETED');
    const totalUnits = subOrders.reduce((sum, so) => sum + so.units, 0);

    if (totalUnits > 0) {
      for (const subOrder of subOrders) {
        const subOrderPayout = Math.round(payment.factoryPayout * subOrder.units / totalUnits);

        const event: PaymentReleasedEvent = {
          source:     EVENT_SOURCE.PAYMENTS,
          detailType: DETAIL_TYPE.PAYMENT_RELEASED,
          detail: {
            orderId:          payment.orderId,
            orderNumber:      payment.order.orderNumber,
            paymentId:        payment.id,
            factoryId:        subOrder.factoryId,
            subOrderId:       subOrder.id,
            amount:           subOrderPayout,
            currency:         payment.currency,
            gatewayProvider:  payment.gatewayProvider as PaymentGatewayProvider,
            gatewayReference: payment.gatewayReference ?? '',
            releasedAt:       new Date().toISOString(),
            traceOrderId,
          },
        };

        await this.eventsService.publish(event);
      }
    }

    this.logger.log(
      `Payment released: ${payment.id} for order ${payment.order.orderNumber} (${subOrders.length} factory payouts)`,
      PaymentService.CONTEXT,
    );

    return released;
  }

  private async refundPayment(paymentId: string, _traceOrderId: string): Promise<Payment> {
    // ── STUB — real implementation calls gateway refund API ──────────────────
    // Peach:       POST /v1/payments/{gatewayReference}/refunds
    // Flutterwave: POST /v3/transactions/{flw_ref}/refund
    // ─────────────────────────────────────────────────────────────────────────
    const refunded = await this.paymentRepository.refund(paymentId);

    this.logger.log(`Payment refunded: ${paymentId}`, PaymentService.CONTEXT);

    return refunded;
  }

  private assertBuyerOrAdmin(buyerId: string, actor: JwtPayload): void {
    if (actor.role === Role.ADMIN) return;
    if (buyerId !== actor.sub) {
      throw new ForbiddenException('You do not have access to this payment');
    }
  }
}
