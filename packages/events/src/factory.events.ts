import { DETAIL_TYPE, EVENT_SOURCE } from './constants';
import { type AdminEvent, type BaseEventDetail } from './base.types';

// ─── FactoryVerified ───────────────────────────────────────────────────────────

/**
 * Emitted by: factory-service
 * Consumed by: notifications-service (email to factory owner),
 *              orders-service (factory now eligible for allocation)
 *
 * Triggered when a Camluk ops admin approves a factory's verification.
 * Status transitions: PENDING → VERIFIED.
 *
 * Note on traceOrderId: For factory lifecycle events there is no order.
 * The traceOrderId here carries a factory-verification flow trace UUID,
 * generated at verification time. It correlates all CloudWatch log entries
 * for this verification operation across services.
 */
export interface FactoryVerifiedDetail extends BaseEventDetail {
  readonly factoryId: string;
  readonly factoryName: string;
  readonly ownerId: string;
  readonly registrationNumber: string;
  readonly country: string;
  readonly region: string;
}

export type FactoryVerifiedEvent = AdminEvent<
  typeof EVENT_SOURCE.FACTORY,
  typeof DETAIL_TYPE.FACTORY_VERIFIED,
  FactoryVerifiedDetail
>;
