/**
 * ADMIN Platform — Base Event Types
 *
 * All ADMIN events follow this shape:
 *   { source, detailType, detail }
 *
 * Every detail payload MUST include traceOrderId as required by the
 * architecture rules. For non-order events (e.g. FactoryVerified), the
 * traceOrderId carries a factory-lifecycle trace UUID that correlates
 * CloudWatch log entries for that verification flow.
 */

import { type DetailType, type EventSource } from './constants';

// ─── Base detail ───────────────────────────────────────────────────────────────

/**
 * Every event payload must include traceOrderId for end-to-end tracing.
 * Services must generate this UUID once per logical flow and pass it through
 * every downstream event and log entry.
 */
export interface BaseEventDetail {
  /** End-to-end distributed trace ID. Correlates all events in a single flow. */
  readonly traceOrderId: string;
}

// ─── Typed event ──────────────────────────────────────────────────────────────

/**
 * Generic typed ADMIN event.
 *
 * @template TSource    - The EventBridge source string (admin-platform.orders etc.)
 * @template TDetailType - The EventBridge detail-type string (OrderPlaced etc.)
 * @template TDetail    - The strongly-typed event payload
 *
 * Usage:
 *   type OrderPlacedEvent = AdminEvent<
 *     typeof EVENT_SOURCE.ORDERS,
 *     typeof DETAIL_TYPE.ORDER_PLACED,
 *     OrderPlacedDetail
 *   >;
 */
export interface AdminEvent<
  TSource extends EventSource,
  TDetailType extends DetailType,
  TDetail extends BaseEventDetail,
> {
  readonly source: TSource;
  readonly detailType: TDetailType;
  readonly detail: TDetail;
}

// ─── EventBridge publish types ─────────────────────────────────────────────────

/**
 * Shape passed to PutEventsRequestEntry (AWS EventBridge SDK v3).
 * The Detail field is JSON.stringify(event.detail).
 * Services call toEventBridgeEntry(event) to produce this shape.
 */
export interface EventBridgePutEntry {
  readonly Source: EventSource;
  readonly DetailType: DetailType;
  /** JSON-serialised detail payload */
  readonly Detail: string;
  readonly EventBusName: string;
}

/**
 * Converts a typed ADMIN event into the shape required by the AWS SDK's
 * PutEventsRequestEntry. All services use this helper to publish events.
 *
 * @example
 *   const entry = toEventBridgeEntry(event, process.env.AWS_EVENTBRIDGE_BUS_NAME);
 *   await client.send(new PutEventsCommand({ Entries: [entry] }));
 */
export function toEventBridgeEntry<
  TSource extends EventSource,
  TDetailType extends DetailType,
  TDetail extends BaseEventDetail,
>(
  event: AdminEvent<TSource, TDetailType, TDetail>,
  eventBusName: string,
): EventBridgePutEntry {
  return {
    Source: event.source,
    DetailType: event.detailType,
    Detail: JSON.stringify(event.detail),
    EventBusName: eventBusName,
  };
}

// ─── Received event (consumer side) ──────────────────────────────────────────

/**
 * Shape of the event received by an EventBridge consumer (Lambda, SQS trigger).
 * Note: AWS uses 'detail-type' (kebab-case) in received events, but 'DetailType'
 * (PascalCase) when publishing. This interface mirrors the received shape.
 */
export interface ReceivedEventBridgeEvent<TDetail extends BaseEventDetail> {
  readonly version: string;
  readonly id: string;
  readonly source: EventSource;
  readonly 'detail-type': DetailType;
  readonly account: string;
  readonly time: string;
  readonly region: string;
  readonly detail: TDetail;
}
