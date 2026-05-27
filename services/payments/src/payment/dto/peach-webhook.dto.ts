import { IsString, IsOptional } from 'class-validator';

/**
 * Peach Payments webhook notification payload.
 *
 * Peach sends a JSON POST to our webhook URL when a transaction completes.
 * Full spec: https://developer.peachpayments.com/docs/checkout-webhooks
 *
 * Webhook signature validation:
 *   - Peach sends X-Initialization-Vector and X-Authentication-Tag headers
 *   - We validate the HMAC-SHA256 signature using PEACH_WEBHOOK_SECRET
 *
 * Result codes:
 *   000.000.000 — Transaction succeeded
 *   000.100.110 — Request successfully processed in Merchant in Connector Test Mode
 *   Anything else — Transaction failed
 */
export class PeachWebhookDto {
  /** Peach Payments transaction ID */
  @IsString()
  id!: string;

  /**
   * Result code. Success = /^(000\.000\.|000\.100\.110)/.
   * @see https://developer.peachpayments.com/docs/payment-result-codes
   */
  @IsString()
  'result.code'!: string;

  @IsString()
  @IsOptional()
  'result.description'?: string;

  /**
   * Our merchantTransactionId — set to the Payment.id when initiating checkout.
   * Used to look up the payment record.
   */
  @IsString()
  merchantTransactionId!: string;

  /** Amount in decimal string, e.g. "1250.00" */
  @IsString()
  amount!: string;

  /** ISO 4217 currency code */
  @IsString()
  currency!: string;

  @IsString()
  @IsOptional()
  paymentType?: string;
}
