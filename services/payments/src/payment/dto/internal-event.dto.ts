import { IsString, IsBoolean } from 'class-validator';

/**
 * Internal event DTOs — consumed by EventBridge-to-HTTP targets.
 *
 * The API Gateway routes these from EventBridge rules to the payments service.
 * Authentication uses the X-Internal-Secret header (not JWT).
 *
 * These are structurally equivalent to the EventBridge event detail payloads.
 */

export class OrderCompletedInternalDto {
  @IsString()
  orderId!: string;

  @IsString()
  orderNumber!: string;

  @IsString()
  buyerId!: string;

  /** Total order value in ZAR cents */
  @IsString()
  traceOrderId!: string;
}

export class OrderCancelledInternalDto {
  @IsString()
  orderId!: string;

  @IsString()
  orderNumber!: string;

  @IsString()
  buyerId!: string;

  @IsBoolean()
  paymentWasHeld!: boolean;

  @IsString()
  traceOrderId!: string;
}
