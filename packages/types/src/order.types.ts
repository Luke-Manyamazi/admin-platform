import { type OrderStatus, type SubOrderStatus } from './enums';

// ─── Specifications ────────────────────────────────────────────────────────────

/**
 * Product specifications stored as flexible JSON.
 * Values may include dimensions, materials, colours, tolerances, etc.
 * Services that need to validate specific spec shapes should narrow this type.
 */
export type OrderSpecifications = Record<string, unknown>;

// ─── Sub-order ─────────────────────────────────────────────────────────────────

/**
 * A sub-order is one factory's portion of a buyer order.
 * The AI engine splits a large order across multiple verified factories.
 * trustScoreAtAllocation is snapshotted at allocation time for audit purposes.
 */
export interface SubOrder {
  readonly id: string;
  readonly orderId: string;
  readonly factoryId: string;
  readonly units: number;
  readonly status: SubOrderStatus;
  readonly deadline: Date;
  /** Factory's trust score AT THE MOMENT of allocation — immutable audit record */
  readonly trustScoreAtAllocation: number;
  readonly notes: string | null;
  /** Production progress 0–100 (%) — updated by factory via the portal */
  readonly progressPercent: number;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SubOrderResponse {
  readonly id: string;
  readonly orderId: string;
  readonly factoryId: string;
  /** Populated when factory details are joined */
  readonly factoryName?: string;
  readonly units: number;
  readonly status: SubOrderStatus;
  readonly deadline: string;
  readonly trustScoreAtAllocation: number;
  readonly notes: string | null;
  readonly progressPercent: number;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Order event ───────────────────────────────────────────────────────────────

/**
 * Immutable audit log of every state change on an order.
 * traceOrderId ties together all events across services for a single order.
 */
export interface OrderEvent {
  readonly id: string;
  readonly orderId: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  /** End-to-end trace identifier — matches the EventBridge event traceOrderId */
  readonly traceOrderId: string;
  readonly actorId: string | null;
  readonly actorRole: string | null;
  readonly createdAt: Date;
}

export interface OrderEventResponse {
  readonly id: string;
  readonly orderId: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly traceOrderId: string;
  readonly actorId: string | null;
  readonly actorRole: string | null;
  readonly createdAt: string;
}

// ─── Order ─────────────────────────────────────────────────────────────────────

/**
 * Core order domain entity.
 *
 * Money fields (targetUnitPrice, totalValue) are ALWAYS integers in ZAR cents.
 * totalValue = quantityUnits * targetUnitPrice (set when order is placed).
 * orderNumber format: ADMIN-{YEAR}-{5-digit-sequence} e.g. ADMIN-2024-00001
 */
export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  readonly status: OrderStatus;
  readonly productCategory: string;
  readonly productName: string;
  readonly specifications: OrderSpecifications;
  readonly quantityUnits: number;
  readonly unitOfMeasure: string;
  /** Price per unit in ZAR cents — integer, never float */
  readonly targetUnitPrice: number;
  /** Total order value in ZAR cents — integer, never float */
  readonly totalValue: number;
  readonly currency: string;
  readonly deadline: Date;
  readonly deliveryAddress: string;
  readonly deliveryCountry: string;
  readonly notes: string | null;
  /** Immutable trace ID — links all EventBridge events for this order */
  readonly traceOrderId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Order with related sub-orders and optional event log loaded */
export interface OrderWithSubOrders extends Order {
  readonly subOrders: readonly SubOrder[];
  readonly events?: readonly OrderEvent[];
}

// ─── Response shapes ───────────────────────────────────────────────────────────

export interface OrderResponse {
  readonly id: string;
  readonly orderNumber: string;
  readonly buyerId: string;
  readonly status: OrderStatus;
  readonly productCategory: string;
  readonly productName: string;
  readonly specifications: OrderSpecifications;
  readonly quantityUnits: number;
  readonly unitOfMeasure: string;
  /** ZAR cents */
  readonly targetUnitPrice: number;
  /** ZAR cents */
  readonly totalValue: number;
  readonly currency: string;
  readonly deadline: string;
  readonly deliveryAddress: string;
  readonly deliveryCountry: string;
  readonly notes: string | null;
  readonly traceOrderId: string;
  readonly subOrders?: readonly SubOrderResponse[];
  readonly events?: readonly OrderEventResponse[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ─── Request DTOs ──────────────────────────────────────────────────────────────

/** POST /api/v1/orders — creates a DRAFT order */
export interface CreateOrderDto {
  readonly productCategory: string;
  readonly productName: string;
  readonly specifications: OrderSpecifications;
  readonly quantityUnits: number;
  readonly unitOfMeasure: string;
  /** Target price per unit in ZAR cents */
  readonly targetUnitPrice: number;
  /** ISO8601 datetime string */
  readonly deadline: string;
  readonly deliveryAddress: string;
  readonly deliveryCountry: string;
  readonly notes?: string;
}

/** PATCH /api/v1/orders/:id — only allowed while status is DRAFT */
export interface UpdateOrderDto {
  readonly productName?: string;
  readonly specifications?: OrderSpecifications;
  readonly quantityUnits?: number;
  readonly targetUnitPrice?: number;
  readonly deadline?: string;
  readonly deliveryAddress?: string;
  readonly deliveryCountry?: string;
  readonly notes?: string | null;
}

/** POST /api/v1/orders/:id/place — moves DRAFT → PLACED, triggers AI allocation */
export interface PlaceOrderDto {
  readonly confirmPricing: boolean;
}

/** POST /api/v1/orders/:id/cancel */
export interface CancelOrderDto {
  readonly reason: string;
}

// ─── List filters ──────────────────────────────────────────────────────────────

export interface OrderListFilters {
  readonly status?: OrderStatus;
  readonly buyerId?: string;
  readonly productCategory?: string;
  /** ISO8601 — filter orders created from this date */
  readonly from?: string;
  /** ISO8601 — filter orders created up to this date */
  readonly to?: string;
}

// ─── AI allocation ────────────────────────────────────────────────────────────

/**
 * Allocation suggestion from the Cassava AI engine.
 * Returned as part of the allocation preview before factories are assigned.
 */
export interface AllocationSuggestion {
  readonly factoryId: string;
  readonly factoryName: string;
  readonly units: number;
  readonly trustScore: number;
  readonly estimatedCompletionDate: string;
  readonly confidenceScore: number; // 0–1, AI confidence in this match
}
