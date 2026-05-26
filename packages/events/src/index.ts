/**
 * @admin-platform/events — Public API
 *
 * Typed AWS EventBridge event definitions for the ADMIN platform.
 *
 * ─── Usage: publishing an event ──────────────────────────────────────────────
 *
 *   import {
 *     EVENT_SOURCE,
 *     DETAIL_TYPE,
 *     toEventBridgeEntry,
 *     type OrderPlacedEvent,
 *   } from '@admin-platform/events';
 *   import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
 *
 *   const event: OrderPlacedEvent = {
 *     source: EVENT_SOURCE.ORDERS,
 *     detailType: DETAIL_TYPE.ORDER_PLACED,
 *     detail: {
 *       traceOrderId: 'uuid-v4',
 *       orderId: 'cuid',
 *       orderNumber: 'ADMIN-2024-00001',
 *       buyerId: 'cuid',
 *       totalValue: 125000,   // ZAR cents
 *       currency: 'ZAR',
 *       deadline: '2024-03-01T00:00:00.000Z',
 *       productName: 'Industrial Valves',
 *       productCategory: 'Valves & Fittings',
 *     },
 *   };
 *
 *   const entry = toEventBridgeEntry(event, process.env.AWS_EVENTBRIDGE_BUS_NAME);
 *   await client.send(new PutEventsCommand({ Entries: [entry] }));
 *
 * ─── Usage: consuming an event ───────────────────────────────────────────────
 *
 *   import { type ReceivedEventBridgeEvent, type OrderPlacedDetail } from '@admin-platform/events';
 *
 *   // In a Lambda handler or SQS consumer:
 *   function handleEvent(event: ReceivedEventBridgeEvent<OrderPlacedDetail>) {
 *     const { traceOrderId, orderId, totalValue } = event.detail;
 *   }
 */

// ─── Constants ────────────────────────────────────────────────────────────────
export { EVENT_SOURCE, DETAIL_TYPE } from './constants';
export type { EventSource, DetailType } from './constants';

// ─── Base types + publisher utility ──────────────────────────────────────────
export { toEventBridgeEntry } from './base.types';
export type {
  BaseEventDetail,
  AdminEvent,
  EventBridgePutEntry,
  ReceivedEventBridgeEvent,
} from './base.types';

// ─── Order events ─────────────────────────────────────────────────────────────
export type {
  OrderPlacedDetail,
  OrderPlacedEvent,
  OrderAllocatedSubOrder,
  OrderAllocatedDetail,
  OrderAllocatedEvent,
  OrderCompletedDetail,
  OrderCompletedEvent,
  OrderCancelledDetail,
  OrderCancelledEvent,
  OrderDisputedDetail,
  OrderDisputedEvent,
} from './order.events';

// ─── Factory events ───────────────────────────────────────────────────────────
export type {
  FactoryVerifiedDetail,
  FactoryVerifiedEvent,
} from './factory.events';

// ─── Payment events ───────────────────────────────────────────────────────────
export type {
  PaymentHeldDetail,
  PaymentHeldEvent,
  PaymentReleasedDetail,
  PaymentReleasedEvent,
} from './payment.events';

// ─── Sub-order events ─────────────────────────────────────────────────────────
export type {
  SubOrderAcceptedDetail,
  SubOrderAcceptedEvent,
  SubOrderDeclinedDetail,
  SubOrderDeclinedEvent,
  SubOrderCompletedDetail,
  SubOrderCompletedEvent,
} from './suborder.events';

// ─── Union type of all events ─────────────────────────────────────────────────

import type { OrderPlacedEvent } from './order.events';
import type { OrderAllocatedEvent } from './order.events';
import type { OrderCompletedEvent } from './order.events';
import type { OrderCancelledEvent } from './order.events';
import type { OrderDisputedEvent } from './order.events';
import type { FactoryVerifiedEvent } from './factory.events';
import type { PaymentHeldEvent } from './payment.events';
import type { PaymentReleasedEvent } from './payment.events';
import type { SubOrderAcceptedEvent } from './suborder.events';
import type { SubOrderDeclinedEvent } from './suborder.events';
import type { SubOrderCompletedEvent } from './suborder.events';

/**
 * Discriminated union of every ADMIN platform event.
 * Useful for exhaustive switch statements in event routers.
 *
 * @example
 *   function route(event: AnyAdminEvent) {
 *     switch (event.detailType) {
 *       case DETAIL_TYPE.ORDER_PLACED:   return handleOrderPlaced(event);
 *       case DETAIL_TYPE.FACTORY_VERIFIED: return handleFactoryVerified(event);
 *       // TypeScript will error if a case is missing
 *     }
 *   }
 */
export type AnyAdminEvent =
  | OrderPlacedEvent
  | OrderAllocatedEvent
  | OrderCompletedEvent
  | OrderCancelledEvent
  | OrderDisputedEvent
  | FactoryVerifiedEvent
  | PaymentHeldEvent
  | PaymentReleasedEvent
  | SubOrderAcceptedEvent
  | SubOrderDeclinedEvent
  | SubOrderCompletedEvent;
