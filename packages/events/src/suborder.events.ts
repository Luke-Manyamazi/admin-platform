import { DETAIL_TYPE, EVENT_SOURCE } from './constants';
import { type AdminEvent, type BaseEventDetail } from './base.types';

// ─── SubOrderAccepted ──────────────────────────────────────────────────────────

/**
 * Emitted by: factory-service
 * Consumed by: orders-service (track progress toward IN_PRODUCTION),
 *              notifications-service (notify buyer)
 *
 * Triggered when a factory accepts a sub-order assigned by the AI engine.
 * Status transitions: PENDING_ACCEPTANCE → ACCEPTED.
 * When all sub-orders for an order are ACCEPTED, the order moves to IN_PRODUCTION.
 */
export interface SubOrderAcceptedDetail extends BaseEventDetail {
  readonly subOrderId: string;
  readonly orderId: string;
  readonly orderNumber: string;
  readonly factoryId: string;
  readonly factoryName: string;
  readonly units: number;
  /** ISO8601 */
  readonly acceptedAt: string;
}

export type SubOrderAcceptedEvent = AdminEvent<
  typeof EVENT_SOURCE.SUBORDERS,
  typeof DETAIL_TYPE.SUBORDER_ACCEPTED,
  SubOrderAcceptedDetail
>;

// ─── SubOrderDeclined ─────────────────────────────────────────────────────────

/**
 * Emitted by: factory-service
 * Consumed by: orders-service (trigger re-allocation for this portion)
 *
 * Triggered when a factory declines a sub-order.
 * Status transitions: PENDING_ACCEPTANCE → DECLINED.
 * The orders-service must immediately re-run allocation for the declined units.
 */
export interface SubOrderDeclinedDetail extends BaseEventDetail {
  readonly subOrderId: string;
  readonly orderId: string;
  readonly orderNumber: string;
  readonly factoryId: string;
  readonly units: number;
  readonly reason: string | null;
  /** ISO8601 */
  readonly declinedAt: string;
}

export type SubOrderDeclinedEvent = AdminEvent<
  typeof EVENT_SOURCE.SUBORDERS,
  typeof DETAIL_TYPE.SUBORDER_DECLINED,
  SubOrderDeclinedDetail
>;

// ─── SubOrderCompleted ─────────────────────────────────────────────────────────

/**
 * Emitted by: factory-service
 * Consumed by: orders-service (check if all sub-orders done → DISPATCHED),
 *              payments-service (trigger payout to this factory)
 *
 * Triggered when a factory marks their portion as complete and dispatched.
 * Status transitions: QUALITY_CHECK → COMPLETED.
 * When all sub-orders for an order are COMPLETED, the order moves to DISPATCHED.
 */
export interface SubOrderCompletedDetail extends BaseEventDetail {
  readonly subOrderId: string;
  readonly orderId: string;
  readonly orderNumber: string;
  readonly factoryId: string;
  readonly units: number;
  readonly trackingReference: string | null;
  /** ISO8601 */
  readonly completedAt: string;
}

export type SubOrderCompletedEvent = AdminEvent<
  typeof EVENT_SOURCE.SUBORDERS,
  typeof DETAIL_TYPE.SUBORDER_COMPLETED,
  SubOrderCompletedDetail
>;
