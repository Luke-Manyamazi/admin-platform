/**
 * @admin-platform/types — Public API
 *
 * Single entry point for all shared TypeScript types used across the
 * ADMIN platform (api-gateway, all services, web, admin apps).
 *
 * Import enums as values:
 *   import { Role, OrderStatus } from '@admin-platform/types';
 *
 * Import interfaces as types:
 *   import type { Order, Factory, ApiResponse } from '@admin-platform/types';
 *
 * Import type guards as values:
 *   import { isApiSuccess, isApiError } from '@admin-platform/types';
 */

// ─── Enums (runtime values) ───────────────────────────────────────────────────
export {
  Role,
  FactoryStatus,
  DocumentType,
  OrderStatus,
  SubOrderStatus,
  PaymentStatus,
  PaymentGatewayProvider,
  NotificationChannel,
  NotificationStatus,
} from './enums';

// ─── User types ───────────────────────────────────────────────────────────────
export type {
  User,
  UserWithPassword,
  UserResponse,
  RegisterDto,
  LoginDto,
  UpdateUserDto,
  ChangePasswordDto,
  AuthResponse,
  JwtPayload,
} from './user.types';

// ─── Factory types ────────────────────────────────────────────────────────────
export type {
  FactoryDocument,
  FactoryDocumentResponse,
  Factory,
  FactoryWithDocuments,
  FactoryResponse,
  CreateFactoryDto,
  UpdateFactoryDto,
  VerifyFactoryDto,
  FactoryListFilters,
} from './factory.types';

// ─── Order types ──────────────────────────────────────────────────────────────
export type {
  OrderSpecifications,
  SubOrder,
  SubOrderResponse,
  OrderEvent,
  OrderEventResponse,
  Order,
  OrderWithSubOrders,
  OrderResponse,
  CreateOrderDto,
  UpdateOrderDto,
  PlaceOrderDto,
  CancelOrderDto,
  OrderListFilters,
  AllocationSuggestion,
} from './order.types';

// ─── Payment types ────────────────────────────────────────────────────────────
export type {
  Payment,
  PaymentResponse,
  PaymentBreakdown,
  InitiatePaymentDto,
  ReleasePaymentDto,
  RefundPaymentDto,
  NormalisedPaymentWebhook,
} from './payment.types';

// ─── Notification types ───────────────────────────────────────────────────────
export type {
  NotificationType,
  Notification,
  NotificationResponse,
  SendNotificationDto,
  OrderPlacedTemplateData,
  OrderAllocatedTemplateData,
  PaymentHeldTemplateData,
  FactoryVerifiedTemplateData,
} from './notification.types';

// ─── API response types + type guards (runtime values) ───────────────────────
export type {
  PaginationMeta,
  PaginationQuery,
  ApiSuccessResponse,
  ApiPaginatedResponse,
  ApiErrorDetail,
  ApiErrorResponse,
  ApiResponse,
  ApiErrorCode,
} from './api.types';

export { isApiSuccess, isApiError } from './api.types';
