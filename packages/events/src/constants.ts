/**
 * ADMIN Platform — EventBridge Constants
 *
 * Use these instead of magic strings in every service.
 * Consumers match events with EventBridge rules using these exact values.
 *
 * EventBridge rule pattern example:
 *   {
 *     "source": ["admin-platform.orders"],
 *     "detail-type": ["OrderPlaced"]
 *   }
 */

// ─── Event sources ─────────────────────────────────────────────────────────────
// Convention: admin-platform.{service-name}
// Must match the Source field in PutEventsRequestEntry.

export const EVENT_SOURCE = {
  ORDERS: 'admin-platform.orders',
  FACTORY: 'admin-platform.factory',
  PAYMENTS: 'admin-platform.payments',
  SUBORDERS: 'admin-platform.suborders',
} as const;

export type EventSource = (typeof EVENT_SOURCE)[keyof typeof EVENT_SOURCE];

// ─── Detail types ──────────────────────────────────────────────────────────────
// Convention: PascalCase, no spaces.
// Must match the DetailType field in PutEventsRequestEntry.

export const DETAIL_TYPE = {
  // ── Orders ──────────────────────────────────────────────────────────────────
  ORDER_PLACED: 'OrderPlaced',
  ORDER_ALLOCATED: 'OrderAllocated',
  ORDER_COMPLETED: 'OrderCompleted',
  ORDER_CANCELLED: 'OrderCancelled',
  ORDER_DISPUTED: 'OrderDisputed',

  // ── Factories ─────────────────────────────────────────────────────────────
  FACTORY_VERIFIED: 'FactoryVerified',

  // ── Payments ──────────────────────────────────────────────────────────────
  PAYMENT_HELD: 'PaymentHeld',
  PAYMENT_RELEASED: 'PaymentReleased',

  // ── Sub-orders ────────────────────────────────────────────────────────────
  SUBORDER_ACCEPTED: 'SubOrderAccepted',
  SUBORDER_DECLINED: 'SubOrderDeclined',
  SUBORDER_COMPLETED: 'SubOrderCompleted',
} as const;

export type DetailType = (typeof DETAIL_TYPE)[keyof typeof DETAIL_TYPE];
