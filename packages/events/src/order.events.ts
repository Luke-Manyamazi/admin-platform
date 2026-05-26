import { DETAIL_TYPE, EVENT_SOURCE } from './constants';
import { type AdminEvent, type BaseEventDetail } from './base.types';

// ─── OrderPlaced ───────────────────────────────────────────────────────────────

/**
 * Emitted by: orders-service
 * Consumed by: notifications-service (confirm to buyer), payments-service (create escrow record)
 *
 * Triggered when a buyer submits an order (DRAFT → PLACED).
 * Initiates the AI allocation flow.
 */
export interface OrderPlacedDetail extends BaseEventDetail {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  /** Total order value in ZAR cents */
  readonly totalValue: number;
  readonly currency: string;
  /** ISO8601 */
  readonly deadline: string;
  readonly productName: string;
  readonly productCategory: string;
}

export type OrderPlacedEvent = AdminEvent<
  typeof EVENT_SOURCE.ORDERS,
  typeof DETAIL_TYPE.ORDER_PLACED,
  OrderPlacedDetail
>;

// ─── OrderAllocated ────────────────────────────────────────────────────────────

/**
 * Emitted by: orders-service (after Cassava AI allocation)
 * Consumed by: factory-service (notify factories), notifications-service
 *
 * Triggered when the AI engine has successfully split the order across factories.
 * Each sub-order is assigned to one factory.
 */
export interface OrderAllocatedSubOrder {
  readonly subOrderId: string;
  readonly factoryId: string;
  readonly units: number;
  /** ISO8601 — may differ from the master order deadline */
  readonly deadline: string;
}

export interface OrderAllocatedDetail extends BaseEventDetail {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  readonly subOrders: readonly OrderAllocatedSubOrder[];
}

export type OrderAllocatedEvent = AdminEvent<
  typeof EVENT_SOURCE.ORDERS,
  typeof DETAIL_TYPE.ORDER_ALLOCATED,
  OrderAllocatedDetail
>;

// ─── OrderCompleted ────────────────────────────────────────────────────────────

/**
 * Emitted by: orders-service
 * Consumed by: payments-service (release escrow), notifications-service
 *
 * Triggered when the buyer confirms receipt of all sub-orders (→ DELIVERED).
 * The payments-service releases held funds to factories upon receiving this event.
 */
export interface OrderCompletedDetail extends BaseEventDetail {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  /** Total order value in ZAR cents */
  readonly totalValue: number;
  readonly currency: string;
  /** ISO8601 */
  readonly completedAt: string;
}

export type OrderCompletedEvent = AdminEvent<
  typeof EVENT_SOURCE.ORDERS,
  typeof DETAIL_TYPE.ORDER_COMPLETED,
  OrderCompletedDetail
>;

// ─── OrderCancelled ────────────────────────────────────────────────────────────

/**
 * Emitted by: orders-service
 * Consumed by: payments-service (refund if held), notifications-service,
 *              factory-service (notify affected factories)
 *
 * Triggered when a buyer or admin cancels an order.
 * If payment is HELD, payments-service must initiate a refund.
 */
export interface OrderCancelledDetail extends BaseEventDetail {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  readonly reason: string;
  /** True if payment was held at time of cancellation — triggers refund flow */
  readonly paymentWasHeld: boolean;
  /** ISO8601 */
  readonly cancelledAt: string;
}

export type OrderCancelledEvent = AdminEvent<
  typeof EVENT_SOURCE.ORDERS,
  typeof DETAIL_TYPE.ORDER_CANCELLED,
  OrderCancelledDetail
>;

// ─── OrderDisputed ────────────────────────────────────────────────────────────

/**
 * Emitted by: orders-service
 * Consumed by: payments-service (freeze escrow), notifications-service,
 *              internal Camluk ops tooling
 *
 * Triggered when a buyer raises a dispute after delivery.
 * Escrow remains HELD until dispute is resolved by Camluk ops team.
 */
export interface OrderDisputedDetail extends BaseEventDetail {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  readonly reason: string;
  /** ISO8601 */
  readonly disputedAt: string;
}

export type OrderDisputedEvent = AdminEvent<
  typeof EVENT_SOURCE.ORDERS,
  typeof DETAIL_TYPE.ORDER_DISPUTED,
  OrderDisputedDetail
>;
