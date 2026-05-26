/**
 * ADMIN Platform — Canonical Enums
 *
 * These mirror the Prisma schema enums exactly.
 * String values are used so they serialise cleanly to JSON and match
 * Prisma's generated enum values without any transform layer.
 *
 * Import as values (not types) since enums have runtime representations:
 *   import { Role, OrderStatus } from '@admin-platform/types';
 */

// ─── User ─────────────────────────────────────────────────────────────────────

export enum Role {
  BUYER = 'BUYER',
  FACTORY_OWNER = 'FACTORY_OWNER',
  ADMIN = 'ADMIN',
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export enum FactoryStatus {
  /** Registered but not yet reviewed by Camluk ops team */
  PENDING = 'PENDING',
  /** Passed all verification checks — eligible to receive sub-orders */
  VERIFIED = 'VERIFIED',
  /** Temporarily suspended — cannot receive new sub-orders */
  SUSPENDED = 'SUSPENDED',
  /** Failed verification — cannot onboard until re-application */
  REJECTED = 'REJECTED',
}

export enum DocumentType {
  ISO_CERTIFICATE = 'ISO_CERTIFICATE',
  REGISTRATION = 'REGISTRATION',
  TAX_CLEARANCE = 'TAX_CLEARANCE',
  COMPLIANCE = 'COMPLIANCE',
  OTHER = 'OTHER',
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export enum OrderStatus {
  /** Buyer has started filling in the order form but not submitted */
  DRAFT = 'DRAFT',
  /** Buyer has submitted the order — awaiting allocation */
  PLACED = 'PLACED',
  /** AI engine is selecting and matching factories */
  ALLOCATING = 'ALLOCATING',
  /** Sub-orders have been assigned to factories, awaiting acceptance */
  ALLOCATED = 'ALLOCATED',
  /** At least one factory has started production */
  IN_PRODUCTION = 'IN_PRODUCTION',
  /** Production complete — quality check underway */
  QUALITY_CHECK = 'QUALITY_CHECK',
  /** All sub-orders dispatched to buyer */
  DISPATCHED = 'DISPATCHED',
  /** Buyer confirmed delivery — escrow released to factories */
  DELIVERED = 'DELIVERED',
  /** Order cancelled before fulfilment */
  CANCELLED = 'CANCELLED',
  /** Buyer has raised a dispute — escrow held */
  DISPUTED = 'DISPUTED',
}

export enum SubOrderStatus {
  /** Assigned to factory — awaiting factory acceptance */
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
  /** Factory accepted the sub-order */
  ACCEPTED = 'ACCEPTED',
  /** Factory declined — AI engine will re-allocate */
  DECLINED = 'DECLINED',
  /** Factory has started producing */
  IN_PRODUCTION = 'IN_PRODUCTION',
  /** Production done — quality check in progress */
  QUALITY_CHECK = 'QUALITY_CHECK',
  /** Sub-order fulfilled and dispatched */
  COMPLETED = 'COMPLETED',
  /** Sub-order failed — escalated */
  FAILED = 'FAILED',
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export enum PaymentStatus {
  /** Payment initiated but not yet captured */
  PENDING = 'PENDING',
  /** Funds held in escrow — production underway */
  HELD = 'HELD',
  /** Funds released to factories after delivery confirmation */
  RELEASED = 'RELEASED',
  /** Funds returned to buyer */
  REFUNDED = 'REFUNDED',
  /** Payment gateway returned a failure */
  FAILED = 'FAILED',
}

export enum PaymentGatewayProvider {
  /** South Africa primary gateway — Peach Payments */
  PEACH_PAYMENTS = 'PEACH_PAYMENTS',
  /** Pan-African gateway — Flutterwave */
  FLUTTERWAVE = 'FLUTTERWAVE',
}

// ─── Notifications ────────────────────────────────────────────────────────────

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}
