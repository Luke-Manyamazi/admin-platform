import { IsString, IsObject, IsOptional } from 'class-validator';

/**
 * Flutterwave webhook notification payload.
 *
 * Flutterwave sends a JSON POST to our webhook URL.
 * Full spec: https://developer.flutterwave.com/docs/integration-guides/webhooks/
 *
 * Webhook signature validation:
 *   - Flutterwave sends the verif-hash header
 *   - We compare it to FLUTTERWAVE_WEBHOOK_HASH (SHA256 HMAC is the modern approach;
 *     older integrations use a plain secret comparison)
 *
 * Success condition: event === 'charge.completed' AND data.status === 'successful'
 */
export class FlutterwaveWebhookDto {
  /**
   * Event type. We handle:
   *   'charge.completed' — payment captured
   *   'transfer.completed' — payout completed (informational only)
   */
  @IsString()
  event!: string;

  /** Full transaction payload */
  @IsObject()
  data!: {
    /** Flutterwave transaction ID */
    id: number;
    /** 'successful' | 'failed' | 'pending' */
    status: string;
    /** ISO 4217 currency code */
    currency: string;
    /** Amount in decimal */
    amount: number;
    /**
     * Our Payment.id — set as tx_ref when initiating the charge.
     * Used to look up the payment record.
     */
    tx_ref: string;
    flw_ref?: string;
  };

  @IsObject()
  @IsOptional()
  'event.type'?: string;
}
