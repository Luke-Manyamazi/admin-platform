import { Injectable, UnauthorizedException } from '@nestjs/common';
import { NotificationChannel } from '@admin-platform/types';
import { NotificationRepository } from './notification.repository';
import { SesService } from './ses.service';
import { LoggerService } from '../common/logger/logger.service';
import * as T from './templates/email.templates';
import type {
  OrderPlacedInternalDto,
  OrderAllocatedInternalDto,
  OrderCompletedInternalDto,
  OrderCancelledInternalDto,
  FactoryVerifiedInternalDto,
  PaymentHeldInternalDto,
  PaymentReleasedInternalDto,
  SubOrderAcceptedInternalDto,
  SubOrderDeclinedInternalDto,
  SubOrderCompletedInternalDto,
} from './dto/internal-events.dto';

/**
 * NotificationService — dispatches transactional notifications for every
 * ADMIN platform event.
 *
 * Pattern for each handler:
 *   1. Look up user(s) to notify (email / name)
 *   2. Render email template
 *   3. Create Notification record (PENDING)
 *   4. Send via SES
 *   5. Update Notification record (SENT / FAILED)
 *
 * All handlers are idempotent — calling them twice for the same event
 * will create duplicate Notification records but will not break anything.
 * Deduplication (if needed) can be added via traceOrderId checks.
 */
@Injectable()
export class NotificationService {
  private static readonly CTX = 'NotificationService';

  constructor(
    private readonly repo: NotificationRepository,
    private readonly ses: SesService,
    private readonly logger: LoggerService,
  ) {}

  // ── Secret validation ──────────────────────────────────────────────────────

  validateInternalSecret(secret: string | undefined): void {
    const expected = process.env['INTERNAL_WEBHOOK_SECRET'] ?? 'dev-internal-secret-change-in-prod';
    if (secret !== expected) throw new UnauthorizedException('Invalid internal webhook secret');
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  async onOrderPlaced(dto: OrderPlacedInternalDto): Promise<void> {
    const buyer = await this.repo.findUserById(dto.buyerId);
    if (!buyer) return this.warn('onOrderPlaced', `buyer ${dto.buyerId} not found`);

    const tpl = T.orderPlacedBuyer({
      buyerName:   `${buyer.firstName} ${buyer.lastName}`,
      orderNumber: dto.orderNumber,
      productName: dto.productName,
      totalValue:  dto.totalValue,
      currency:    dto.currency,
      deadline:    dto.deadline,
    });

    await this.sendEmail(buyer.id, 'ORDER_PLACED', buyer.email, tpl);
  }

  async onOrderAllocated(dto: OrderAllocatedInternalDto): Promise<void> {
    // Notify each assigned factory owner
    for (const so of dto.subOrders) {
      const owner = await this.repo.findFactoryOwner(so.factoryId);
      if (!owner) { this.warn('onOrderAllocated', `factory owner for ${so.factoryId} not found`); continue; }

      const tpl = T.subOrderAssignedFactory({
        factoryOwnerName: `${owner.firstName} ${owner.lastName}`,
        factoryName:      owner.factoryName,
        orderNumber:      dto.orderNumber,
        productName:      'your order',   // productName not in OrderAllocated event — acceptable
        units:            so.units,
        deadline:         so.deadline,
        subOrderId:       so.subOrderId,
      });

      await this.sendEmail(owner.id, 'ORDER_ALLOCATED_FACTORY', owner.email, tpl);
    }
  }

  async onOrderCompleted(dto: OrderCompletedInternalDto): Promise<void> {
    const buyer = await this.repo.findUserById(dto.buyerId);
    if (!buyer) return this.warn('onOrderCompleted', `buyer ${dto.buyerId} not found`);

    const tpl = T.orderCompletedBuyer({
      buyerName:   `${buyer.firstName} ${buyer.lastName}`,
      orderNumber: dto.orderNumber,
      productName: 'your order',
      totalValue:  dto.totalValue,
      currency:    dto.currency,
    });

    await this.sendEmail(buyer.id, 'ORDER_COMPLETED', buyer.email, tpl);
  }

  async onOrderCancelled(dto: OrderCancelledInternalDto): Promise<void> {
    const buyer = await this.repo.findUserById(dto.buyerId);
    if (!buyer) return this.warn('onOrderCancelled', `buyer ${dto.buyerId} not found`);

    const tpl = T.orderCancelledBuyer({
      buyerName:    `${buyer.firstName} ${buyer.lastName}`,
      orderNumber:  dto.orderNumber,
      reason:       dto.reason,
      refundIssued: dto.paymentWasHeld,
    });

    await this.sendEmail(buyer.id, 'ORDER_CANCELLED_BUYER', buyer.email, tpl);
  }

  async onFactoryVerified(dto: FactoryVerifiedInternalDto): Promise<void> {
    const owner = await this.repo.findFactoryOwner(dto.factoryId);
    if (!owner) return this.warn('onFactoryVerified', `factory owner for ${dto.factoryId} not found`);

    const tpl = T.factoryVerifiedOwner({
      factoryOwnerName: `${owner.firstName} ${owner.lastName}`,
      factoryName:      dto.factoryName,
    });

    await this.sendEmail(owner.id, 'FACTORY_VERIFIED', owner.email, tpl);
  }

  async onPaymentHeld(dto: PaymentHeldInternalDto): Promise<void> {
    const buyer = await this.repo.findUserById(dto.buyerId);
    if (!buyer) return this.warn('onPaymentHeld', `buyer ${dto.buyerId} not found`);

    const tpl = T.paymentHeldBuyer({
      buyerName:   `${buyer.firstName} ${buyer.lastName}`,
      orderNumber: dto.orderNumber,
      amount:      dto.amount,
      currency:    dto.currency,
    });

    await this.sendEmail(buyer.id, 'PAYMENT_HELD', buyer.email, tpl);
  }

  async onPaymentReleased(dto: PaymentReleasedInternalDto): Promise<void> {
    const owner = await this.repo.findFactoryOwner(dto.factoryId);
    if (!owner) return this.warn('onPaymentReleased', `factory owner for ${dto.factoryId} not found`);

    const tpl = T.paymentReleasedFactory({
      factoryOwnerName: `${owner.firstName} ${owner.lastName}`,
      factoryName:      owner.factoryName,
      orderNumber:      dto.orderNumber,
      amount:           dto.amount,
      currency:         dto.currency,
    });

    await this.sendEmail(owner.id, 'PAYMENT_RELEASED', owner.email, tpl);
  }

  async onSubOrderAccepted(dto: SubOrderAcceptedInternalDto): Promise<void> {
    const buyer = await this.repo.findOrderBuyer(dto.orderId);
    if (!buyer) return this.warn('onSubOrderAccepted', `buyer for order ${dto.orderId} not found`);

    const tpl = T.subOrderAcceptedBuyer({
      buyerName:   `${buyer.firstName} ${buyer.lastName}`,
      orderNumber: dto.orderNumber,
      factoryName: dto.factoryName,
      units:       dto.units,
      productName: 'your order',
    });

    await this.sendEmail(buyer.id, 'SUBORDER_ACCEPTED', buyer.email, tpl);
  }

  async onSubOrderDeclined(dto: SubOrderDeclinedInternalDto): Promise<void> {
    const buyer = await this.repo.findOrderBuyer(dto.orderId);
    if (!buyer) return this.warn('onSubOrderDeclined', `buyer for order ${dto.orderId} not found`);

    const tpl = T.subOrderDeclinedBuyer({
      buyerName:   `${buyer.firstName} ${buyer.lastName}`,
      orderNumber: dto.orderNumber,
      units:       dto.units,
    });

    await this.sendEmail(buyer.id, 'SUBORDER_DECLINED', buyer.email, tpl);
  }

  async onSubOrderCompleted(dto: SubOrderCompletedInternalDto): Promise<void> {
    const buyer = await this.repo.findOrderBuyer(dto.orderId);
    if (!buyer) return this.warn('onSubOrderCompleted', `buyer for order ${dto.orderId} not found`);

    const tpl = T.subOrderCompletedBuyer({
      buyerName:         `${buyer.firstName} ${buyer.lastName}`,
      orderNumber:       dto.orderNumber,
      factoryName:       `Factory`,   // factoryName not on SubOrderCompleted event — use generic
      units:             dto.units,
      trackingReference: dto.trackingReference ?? null,
    });

    await this.sendEmail(buyer.id, 'SUBORDER_COMPLETED', buyer.email, tpl);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async sendEmail(
    userId: string,
    type: string,
    toEmail: string,
    tpl: T.EmailContent,
  ): Promise<void> {
    const record = await this.repo.create({
      userId,
      type,
      channel: NotificationChannel.EMAIL,
      subject: tpl.subject,
      body:    tpl.text,
    });

    try {
      await this.ses.send({ to: [toEmail], subject: tpl.subject, html: tpl.html, text: tpl.text });
      await this.repo.markSent(record.id);
      this.logger.log(`Sent ${type} email to ${toEmail}`, NotificationService.CTX);
    } catch (err) {
      await this.repo.markFailed(record.id);
      this.logger.error(
        `Failed to send ${type} email to ${toEmail}`,
        err instanceof Error ? err.stack : String(err),
        NotificationService.CTX,
      );
      // Do NOT rethrow — notification failures must not crash the handler
    }
  }

  private warn(handler: string, message: string): void {
    this.logger.warn(`${handler}: ${message} — skipping`, NotificationService.CTX);
  }
}
