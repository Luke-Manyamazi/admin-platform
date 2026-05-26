import { type NotificationChannel, type NotificationStatus } from './enums';

// ─── Notification type literals ───────────────────────────────────────────────

/**
 * All notification types in the platform.
 * Each type corresponds to a specific email template and push notification.
 *
 * Naming convention: {ENTITY}_{EVENT}
 */
export type NotificationType =
  // Order lifecycle
  | 'ORDER_PLACED'
  | 'ORDER_ALLOCATING'
  | 'ORDER_ALLOCATED'
  | 'ORDER_IN_PRODUCTION'
  | 'ORDER_QUALITY_CHECK'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_DISPUTED'
  // Sub-order lifecycle (factory-facing)
  | 'SUBORDER_ASSIGNED'
  | 'SUBORDER_ACCEPTED'
  | 'SUBORDER_DECLINED'
  | 'SUBORDER_COMPLETED'
  | 'SUBORDER_FAILED'
  // Factory lifecycle
  | 'FACTORY_REGISTERED'
  | 'FACTORY_VERIFIED'
  | 'FACTORY_SUSPENDED'
  | 'FACTORY_REJECTED'
  // Payments
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_HELD'
  | 'PAYMENT_RELEASED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_FAILED'
  // Account
  | 'ACCOUNT_EMAIL_VERIFICATION'
  | 'ACCOUNT_PASSWORD_RESET';

// ─── Notification entity ──────────────────────────────────────────────────────

export interface Notification {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly channel: NotificationChannel;
  readonly subject: string | null;
  readonly body: string;
  readonly status: NotificationStatus;
  readonly sentAt: Date | null;
  readonly createdAt: Date;
}

// ─── Response shape ───────────────────────────────────────────────────────────

export interface NotificationResponse {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly channel: NotificationChannel;
  readonly subject: string | null;
  readonly body: string;
  readonly status: NotificationStatus;
  readonly sentAt: string | null;
  readonly createdAt: string;
}

// ─── Request DTOs ──────────────────────────────────────────────────────────────

/**
 * Internal DTO used by services to request a notification be sent.
 * Published as an EventBridge event, consumed by the notifications service.
 */
export interface SendNotificationDto {
  readonly userId: string;
  readonly type: NotificationType;
  readonly channel: NotificationChannel;
  readonly subject?: string;
  readonly body: string;
  /** Key-value pairs injected into the email/SMS template */
  readonly templateData?: Record<string, string>;
}

// ─── Email template data ──────────────────────────────────────────────────────

/**
 * Template data shapes for specific notification types.
 * Used by the notifications service when rendering SES templates.
 */

export interface OrderPlacedTemplateData {
  readonly buyerName: string;
  readonly orderNumber: string;
  readonly productName: string;
  readonly totalValueFormatted: string; // e.g. "R 12,500.00"
  readonly deadline: string; // formatted date
}

export interface OrderAllocatedTemplateData {
  readonly buyerName: string;
  readonly orderNumber: string;
  readonly factoryCount: number;
  readonly estimatedCompletionDate: string;
}

export interface PaymentHeldTemplateData {
  readonly buyerName: string;
  readonly orderNumber: string;
  readonly amountFormatted: string;
  readonly gatewayReference: string;
}

export interface FactoryVerifiedTemplateData {
  readonly ownerName: string;
  readonly factoryName: string;
  readonly dashboardUrl: string;
}
