import { IsString, IsEnum } from 'class-validator';
import { PaymentGatewayProvider } from '@admin-platform/types';

/**
 * Payload for POST /api/v1/payments/initiate
 *
 * Initiates a checkout session for an order. The order must be in PLACED status.
 * Returns a checkout URL the buyer should redirect to complete payment.
 */
export class InitiatePaymentDto {
  @IsString()
  orderId!: string;

  /**
   * Payment gateway to use.
   * PEACH_PAYMENTS — preferred for South African buyers (ZAR, local cards, EFT)
   * FLUTTERWAVE    — preferred for rest-of-Africa buyers (multi-currency)
   */
  @IsEnum(Object.values(PaymentGatewayProvider))
  gatewayProvider!: PaymentGatewayProvider;
}
