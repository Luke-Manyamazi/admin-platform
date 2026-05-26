/**
 * ADMIN Platform — Standard API Response Envelopes
 *
 * ALL API responses from every service and the api-gateway MUST use these types.
 *
 * Success shape:  { success: true,  data: T,     meta: M }
 * Paginated:      { success: true,  data: T[],   meta: PaginationMeta }
 * Error shape:    { success: false, error: { code, message, traceId } }
 *
 * The discriminated union (ApiResponse<T>) makes it easy for TypeScript
 * to narrow the type based on the success field:
 *
 *   if (response.success) {
 *     // TypeScript knows response is ApiSuccessResponse<T>
 *     console.log(response.data);
 *   } else {
 *     // TypeScript knows response is ApiErrorResponse
 *     console.error(response.error.code);
 *   }
 */

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginationQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

// ─── Success responses ────────────────────────────────────────────────────────

export interface ApiSuccessResponse<
  TData,
  TMeta = Record<string, unknown>,
> {
  readonly success: true;
  readonly data: TData;
  readonly meta: TMeta;
}

export interface ApiPaginatedResponse<TData> {
  readonly success: true;
  readonly data: readonly TData[];
  readonly meta: PaginationMeta;
}

// ─── Error response ───────────────────────────────────────────────────────────

/**
 * Standardised error detail.
 * code: machine-readable error code (see ApiErrorCode)
 * message: human-readable description (safe to show to users)
 * traceId: correlates with CloudWatch log streams for debugging
 * field: optional — for validation errors, identifies the invalid field
 */
export interface ApiErrorDetail {
  readonly code: ApiErrorCode;
  readonly message: string;
  readonly traceId: string;
  readonly field?: string;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorDetail;
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type ApiResponse<TData, TMeta = Record<string, unknown>> =
  | ApiSuccessResponse<TData, TMeta>
  | ApiErrorResponse;

// ─── Error codes ──────────────────────────────────────────────────────────────

/**
 * All possible machine-readable error codes.
 * These are returned in ApiErrorDetail.code and should be handled
 * by clients to show appropriate UI error messages.
 */
export type ApiErrorCode =
  // General HTTP-equivalent errors
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'BAD_GATEWAY'
  | 'TOO_MANY_REQUESTS'
  // Order-specific errors
  | 'ORDER_NOT_FOUND'
  | 'ORDER_ALREADY_PLACED'
  | 'ORDER_NOT_IN_DRAFT'
  | 'ORDER_NOT_ALLOCATABLE'
  | 'ORDER_ALREADY_CANCELLED'
  // Factory-specific errors
  | 'FACTORY_NOT_FOUND'
  | 'FACTORY_NOT_VERIFIED'
  | 'FACTORY_ALREADY_REGISTERED'
  | 'INSUFFICIENT_FACTORY_CAPACITY'
  // Payment-specific errors
  | 'PAYMENT_NOT_FOUND'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_ALREADY_EXISTS'
  | 'PAYMENT_NOT_HELD'
  | 'PAYMENT_ALREADY_RELEASED'
  // Auth errors
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID';

// ─── Utility types ────────────────────────────────────────────────────────────

/** Type guard — narrows ApiResponse to success */
export function isApiSuccess<T>(
  response: ApiResponse<T>,
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/** Type guard — narrows ApiResponse to error */
export function isApiError(
  response: ApiResponse<unknown>,
): response is ApiErrorResponse {
  return response.success === false;
}
