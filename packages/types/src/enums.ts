/**
 * ADMIN Platform — Canonical Enums
 *
 * Pattern: `as const` object + derived type alias.
 *
 * WHY NOT TypeScript `enum`?
 * TypeScript string enums are NOT assignable to string-union types in strict mode.
 * Prisma 5+ generates enums as string unions ('BUYER' | 'FACTORY_OWNER' | ...).
 * Using TypeScript `enum` would require type casts in every repository query.
 * The `as const` pattern produces a string-union type that is directly compatible.
 *
 * The API is identical to TypeScript enums:
 *   import { Role } from '@admin-platform/types';
 *   const role: Role = Role.BUYER;    // works (value access)
 *   function fn(r: Role) { ... }      // works (type annotation)
 *   if (role === Role.ADMIN) { ... }  // works (comparison)
 *
 * Import enums as values (not types) since they have runtime representations:
 *   import { Role, OrderStatus } from '@admin-platform/types';
 */

// ─── User ─────────────────────────────────────────────────────────────────────

export const Role = {
  BUYER: 'BUYER',
  FACTORY_OWNER: 'FACTORY_OWNER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// ─── Factory ──────────────────────────────────────────────────────────────────

export const FactoryStatus = {
  /** Registered but not yet reviewed by Camluk ops team */
  PENDING: 'PENDING',
  /** Passed all verification checks — eligible to receive sub-orders */
  VERIFIED: 'VERIFIED',
  /** Temporarily suspended — cannot receive new sub-orders */
  SUSPENDED: 'SUSPENDED',
  /** Failed verification — cannot onboard until re-application */
  REJECTED: 'REJECTED',
} as const;
export type FactoryStatus = (typeof FactoryStatus)[keyof typeof FactoryStatus];

export const DocumentType = {
  ISO_CERTIFICATE: 'ISO_CERTIFICATE',
  REGISTRATION: 'REGISTRATION',
  TAX_CLEARANCE: 'TAX_CLEARANCE',
  COMPLIANCE: 'COMPLIANCE',
  OTHER: 'OTHER',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

// ─── Orders ───────────────────────────────────────────────────────────────────

export const OrderStatus = {
  /** Buyer has started filling in the order form but not submitted */
  DRAFT: 'DRAFT',
  /** Buyer has submitted the order — awaiting allocation */
  PLACED: 'PLACED',
  /** AI engine is selecting and matching factories */
  ALLOCATING: 'ALLOCATING',
  /** Sub-orders have been assigned to factories, awaiting acceptance */
  ALLOCATED: 'ALLOCATED',
  /** At least one factory has started production */
  IN_PRODUCTION: 'IN_PRODUCTION',
  /** Production complete — quality check underway */
  QUALITY_CHECK: 'QUALITY_CHECK',
  /** All sub-orders dispatched to buyer */
  DISPATCHED: 'DISPATCHED',
  /** Buyer confirmed delivery — escrow released to factories */
  DELIVERED: 'DELIVERED',
  /** Order cancelled before fulfilment */
  CANCELLED: 'CANCELLED',
  /** Buyer has raised a dispute — escrow held */
  DISPUTED: 'DISPUTED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const SubOrderStatus = {
  /** Assigned to factory — awaiting factory acceptance */
  PENDING_ACCEPTANCE: 'PENDING_ACCEPTANCE',
  /** Factory accepted the sub-order */
  ACCEPTED: 'ACCEPTED',
  /** Factory declined — AI engine will re-allocate */
  DECLINED: 'DECLINED',
  /** Factory has started producing */
  IN_PRODUCTION: 'IN_PRODUCTION',
  /** Production done — quality check in progress */
  QUALITY_CHECK: 'QUALITY_CHECK',
  /** Sub-order fulfilled and dispatched */
  COMPLETED: 'COMPLETED',
  /** Sub-order failed — escalated */
  FAILED: 'FAILED',
} as const;
export type SubOrderStatus = (typeof SubOrderStatus)[keyof typeof SubOrderStatus];

// ─── Payments ─────────────────────────────────────────────────────────────────

export const PaymentStatus = {
  /** Payment initiated but not yet captured */
  PENDING: 'PENDING',
  /** Funds held in escrow — production underway */
  HELD: 'HELD',
  /** Funds released to factories after delivery confirmation */
  RELEASED: 'RELEASED',
  /** Funds returned to buyer */
  REFUNDED: 'REFUNDED',
  /** Payment gateway returned a failure */
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentGatewayProvider = {
  /** South Africa primary gateway — Peach Payments */
  PEACH_PAYMENTS: 'PEACH_PAYMENTS',
  /** Pan-African gateway — Flutterwave */
  FLUTTERWAVE: 'FLUTTERWAVE',
} as const;
export type PaymentGatewayProvider =
  (typeof PaymentGatewayProvider)[keyof typeof PaymentGatewayProvider];

// ─── Notifications ────────────────────────────────────────────────────────────

export const NotificationChannel = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
} as const;
export type NotificationChannel =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
export type NotificationStatus =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];
