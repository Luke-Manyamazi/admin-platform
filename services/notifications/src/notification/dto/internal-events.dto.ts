import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Internal event DTOs — payload shapes from EventBridge-to-HTTP targets.
 *
 * Each mirrors the `detail` field of the corresponding EventBridge event.
 * Validated via class-validator; the X-Internal-Secret header is checked
 * in the controller before the body is processed.
 */

// ─── Orders ───────────────────────────────────────────────────────────────────

export class OrderPlacedInternalDto {
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() buyerId!: string;
  @IsNumber() totalValue!: number;
  @IsString() currency!: string;
  @IsString() deadline!: string;
  @IsString() productName!: string;
  @IsString() productCategory!: string;
  @IsString() traceOrderId!: string;
}

export class SubOrderInfo {
  @IsString() subOrderId!: string;
  @IsString() factoryId!: string;
  @IsNumber() units!: number;
  @IsString() deadline!: string;
}

export class OrderAllocatedInternalDto {
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() buyerId!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SubOrderInfo) subOrders!: SubOrderInfo[];
  @IsString() traceOrderId!: string;
}

export class OrderCompletedInternalDto {
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() buyerId!: string;
  @IsNumber() totalValue!: number;
  @IsString() currency!: string;
  @IsString() completedAt!: string;
  @IsString() traceOrderId!: string;
}

export class OrderCancelledInternalDto {
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() buyerId!: string;
  @IsString() reason!: string;
  @IsBoolean() paymentWasHeld!: boolean;
  @IsString() cancelledAt!: string;
  @IsString() traceOrderId!: string;
}

// ─── Factories ────────────────────────────────────────────────────────────────

export class FactoryVerifiedInternalDto {
  @IsString() factoryId!: string;
  @IsString() factoryName!: string;
  @IsString() ownerId!: string;
  @IsString() registrationNumber!: string;
  @IsString() country!: string;
  @IsString() region!: string;
  @IsString() traceOrderId!: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export class PaymentHeldInternalDto {
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() paymentId!: string;
  @IsNumber() amount!: number;
  @IsString() currency!: string;
  @IsString() buyerId!: string;
  @IsString() traceOrderId!: string;
}

export class PaymentReleasedInternalDto {
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() paymentId!: string;
  @IsString() factoryId!: string;
  @IsString() subOrderId!: string;
  @IsNumber() amount!: number;
  @IsString() currency!: string;
  @IsString() traceOrderId!: string;
}

// ─── Sub-orders ───────────────────────────────────────────────────────────────

export class SubOrderAcceptedInternalDto {
  @IsString() subOrderId!: string;
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() factoryId!: string;
  @IsString() factoryName!: string;
  @IsNumber() units!: number;
  @IsString() acceptedAt!: string;
  @IsString() traceOrderId!: string;
}

export class SubOrderDeclinedInternalDto {
  @IsString() subOrderId!: string;
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() factoryId!: string;
  @IsNumber() units!: number;
  @IsString() @IsOptional() reason?: string;
  @IsString() declinedAt!: string;
  @IsString() traceOrderId!: string;
}

export class SubOrderCompletedInternalDto {
  @IsString() subOrderId!: string;
  @IsString() orderId!: string;
  @IsString() orderNumber!: string;
  @IsString() factoryId!: string;
  @IsNumber() units!: number;
  @IsString() @IsOptional() trackingReference?: string;
  @IsString() completedAt!: string;
  @IsString() traceOrderId!: string;
}
