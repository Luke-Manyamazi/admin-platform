import { type PaymentGatewayProvider, type PaymentStatus } from './enums';

// ─── Payment ──────────────────────────────────────────────────────────────────

/**
 * Core payment domain entity.
 *
 * All amounts are INTEGERS in ZAR CENTS. Never use floats.
 *
 * Escrow flow:
 *   1. Buyer pays → status = HELD, heldAt set
 *   2. Order delivered → status = RELEASED, releasedAt set, factories paid out
 *   3. Dispute → stays HELD until resolved
 *   4. Cancellation → status = REFUNDED, refundedAt set
 *
 * Commission:
 *   commissionAmount = totalAmount * (COMMISSION_RATE_PERCENT / 100)
 *   factoryPayout    = totalAmount - commissionAmount
 *   Rate comes from COMMISSION_RATE_PERCENT env var (currently 8%)
 */
export interface Payment {
  readonly id: string;
  readonly orderId: string;
  /** Total amount paid by buyer in ZAR cents */
  readonly amount: number;
  /** Camluk platform commission in ZAR cents (8% of amount) */
  readonly commissionAmount: number;
  /** Net payout to factories in ZAR cents (amount - commissionAmount) */
  readonly factoryPayout: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly gatewayProvider: PaymentGatewayProvider;
  readonly gatewayReference: string | null;
  /** Raw JSON response from the payment gateway — stored for audit/debugging */
  readonly gatewayResponse: Record<string, unknown> | null;
  readonly heldAt: Date | null;
  readonly releasedAt: Date | null;
  readonly refundedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── Response shapes ───────────────────────────────────────────────────────────

export interface PaymentResponse {
  readonly id: string;
  readonly orderId: string;
  /** ZAR cents */
  readonly amount: number;
  /** ZAR cents */
  readonly commissionAmount: number;
  /** ZAR cents */
  readonly factoryPayout: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly gatewayProvider: PaymentGatewayProvider;
  readonly gatewayReference: string | null;
  readonly heldAt: string | null;
  readonly releasedAt: string | null;
  readonly refundedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Breakdown ────────────────────────────────────────────────────────────────

/**
 * Payment breakdown shown to buyer before they confirm payment.
 * All amounts in ZAR cents.
 */
export interface PaymentBreakdown {
  readonly totalAmountCents: number;
  readonly commissionAmountCents: number;
  readonly commissionRatePercent: number;
  readonly factoryPayoutCents: number;
  readonly currency: string;
}

// ─── Request DTOs ──────────────────────────────────────────────────────────────

/** POST /api/v1/payments/initiate */
export interface InitiatePaymentDto {
  readonly orderId: string;
  readonly gatewayProvider: PaymentGatewayProvider;
  /** URL the gateway should redirect to after payment */
  readonly returnUrl: string;
  /** URL the gateway should redirect to if the buyer cancels */
  readonly cancelUrl: string;
}

/** POST /api/v1/payments/:id/release — Camluk admin only */
export interface ReleasePaymentDto {
  readonly subOrderIds: readonly string[];
}

/** POST /api/v1/payments/:id/refund — used in dispute resolution */
export interface RefundPaymentDto {
  readonly reason: string;
  readonly partialAmountCents?: number;
}

// ─── Gateway webhook ──────────────────────────────────────────────────────────

/**
 * Normalised webhook payload after parsing provider-specific formats.
 * The payments service normalises both Peach Payments and Flutterwave
 * webhooks into this shape before processing.
 */
export interface NormalisedPaymentWebhook {
  readonly provider: PaymentGatewayProvider;
  readonly gatewayReference: string;
  readonly status: 'SUCCESS' | 'FAILED' | 'PENDING';
  readonly amountCents: number;
  readonly currency: string;
  readonly rawPayload: Record<string, unknown>;
}
