import { DETAIL_TYPE, EVENT_SOURCE } from './constants';
import { type AdminEvent, type BaseEventDetail } from './base.types';
import { type PaymentGatewayProvider } from '@admin-platform/types';

// ─── PaymentHeld ───────────────────────────────────────────────────────────────

/**
 * Emitted by: payments-service
 * Consumed by: orders-service (advance order to ALLOCATED status),
 *              notifications-service (confirm payment to buyer)
 *
 * Triggered when buyer payment is successfully captured and held in escrow.
 * Funds are NOT released until OrderCompleted or OrderCancelled is received.
 */
export interface PaymentHeldDetail extends BaseEventDetail {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly paymentId: string;
  /** Total amount held in ZAR cents */
  readonly amount: number;
  /** Camluk commission in ZAR cents (8%) */
  readonly commissionAmount: number;
  /** Factory net payout in ZAR cents (amount - commissionAmount) */
  readonly factoryPayout: number;
  readonly currency: string;
  readonly gatewayProvider: PaymentGatewayProvider;
  readonly gatewayReference: string;
  /** ISO8601 */
  readonly heldAt: string;
}

export type PaymentHeldEvent = AdminEvent<
  typeof EVENT_SOURCE.PAYMENTS,
  typeof DETAIL_TYPE.PAYMENT_HELD,
  PaymentHeldDetail
>;

// ─── PaymentReleased ───────────────────────────────────────────────────────────

/**
 * Emitted by: payments-service
 * Consumed by: notifications-service (notify factory owner of payout),
 *              factory-service (update factory trust score)
 *
 * Triggered when escrow funds are released to a factory after successful delivery.
 * One event is emitted PER FACTORY receiving a payout (one per sub-order).
 */
export interface PaymentReleasedDetail extends BaseEventDetail {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly paymentId: string;
  readonly factoryId: string;
  readonly subOrderId: string;
  /** Payout amount to THIS factory in ZAR cents */
  readonly amount: number;
  readonly currency: string;
  readonly gatewayProvider: PaymentGatewayProvider;
  readonly gatewayReference: string;
  /** ISO8601 */
  readonly releasedAt: string;
}

export type PaymentReleasedEvent = AdminEvent<
  typeof EVENT_SOURCE.PAYMENTS,
  typeof DETAIL_TYPE.PAYMENT_RELEASED,
  PaymentReleasedDetail
>;
