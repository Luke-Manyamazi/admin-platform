import { Injectable } from '@nestjs/common';
import { type Payment, type Prisma } from '@admin-platform/database';
import { PaymentStatus } from '@admin-platform/types';
import { PrismaService } from '../common/prisma/prisma.service';

// ─── Result types ─────────────────────────────────────────────────────────────

export type PaymentWithOrder = Prisma.PaymentGetPayload<{
  include: { order: { include: { subOrders: true } } };
}>;

export interface CreatePaymentInput {
  readonly orderId: string;
  readonly amount: number;
  readonly commissionAmount: number;
  readonly factoryPayout: number;
  readonly currency: string;
  readonly gatewayProvider: string;
}

export interface HoldPaymentInput {
  readonly gatewayReference: string;
  readonly gatewayResponse: Record<string, unknown>;
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * PaymentRepository — the ONLY place that calls Prisma for payment data.
 *
 * Architecture rule: no Prisma calls in services or controllers.
 */
@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reads ────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<PaymentWithOrder | null> {
    return this.prisma.payment.findFirst({
      where: { id },
      include: { order: { include: { subOrders: true } } },
    });
  }

  async findByOrderId(orderId: string): Promise<PaymentWithOrder | null> {
    return this.prisma.payment.findFirst({
      where: { orderId },
      include: { order: { include: { subOrders: true } } },
    });
  }

  async findPendingByOrderId(orderId: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({
      where: { orderId, status: PaymentStatus.PENDING },
    });
  }

  // ── Writes ───────────────────────────────────────────────────────────────────

  async create(input: CreatePaymentInput): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        orderId:          input.orderId,
        amount:           input.amount,
        commissionAmount: input.commissionAmount,
        factoryPayout:    input.factoryPayout,
        currency:         input.currency,
        status:           PaymentStatus.PENDING,
        gatewayProvider:  input.gatewayProvider,
      },
    });
  }

  async hold(id: string, input: HoldPaymentInput): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status:           PaymentStatus.HELD,
        gatewayReference: input.gatewayReference,
        gatewayResponse:  input.gatewayResponse as Prisma.InputJsonValue,
        heldAt:           new Date(),
      },
    });
  }

  async release(id: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status:     PaymentStatus.RELEASED,
        releasedAt: new Date(),
      },
    });
  }

  async refund(id: string): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status:     PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });
  }

  /**
   * Fetch an Order by id — used to validate an order before creating its first payment.
   * Returns only the fields the payments service needs.
   */
  async findOrderById(orderId: string): Promise<{
    id: string;
    buyerId: string;
    status: string;
    totalValue: number;
    currency: string;
    traceOrderId: string;
    orderNumber: string;
  } | null> {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        totalValue: true,
        currency: true,
        traceOrderId: true,
        orderNumber: true,
      },
    });
  }

  async markFailed(id: string, gatewayResponse: Record<string, unknown>): Promise<Payment> {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status:          PaymentStatus.FAILED,
        gatewayResponse: gatewayResponse as Prisma.InputJsonValue,
      },
    });
  }
}
