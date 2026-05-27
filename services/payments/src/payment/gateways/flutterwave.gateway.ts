import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { LoggerService } from '../../common/logger/logger.service';

export interface FlutterwaveCheckoutSession {
  /** Redirect this URL to the buyer */
  readonly checkoutUrl: string;
  /** Flutterwave payment link reference */
  readonly txRef: string;
}

/**
 * FlutterwaveGateway — Flutterwave integration stub.
 *
 * Flutterwave Standard Payment flow:
 *   POST /v3/payments
 *   - tx_ref, amount, currency, redirect_url, customer, meta
 *   - Returns a payment link the buyer completes in their browser
 *
 * Real implementation replaces the stub methods with actual HTTP calls
 * to process.env.FLUTTERWAVE_API_BASE_URL using process.env.FLUTTERWAVE_SECRET_KEY.
 *
 * Webhook validation: compare the verif-hash header to FLUTTERWAVE_WEBHOOK_HASH.
 */
@Injectable()
export class FlutterwaveGateway {
  private static readonly CONTEXT = 'FlutterwaveGateway';

  private readonly apiBaseUrl: string;
  private readonly secretKey: string;
  private readonly webhookHash: string;

  constructor(private readonly logger: LoggerService) {
    this.apiBaseUrl  = process.env['FLUTTERWAVE_API_BASE_URL']  ?? 'https://api.flutterwave.com/v3';
    this.secretKey   = process.env['FLUTTERWAVE_SECRET_KEY']    ?? '';
    this.webhookHash = process.env['FLUTTERWAVE_WEBHOOK_HASH']  ?? 'dev-flutterwave-webhook-hash';
  }

  /**
   * Create a Flutterwave payment link for the given payment.
   *
   * @param paymentId   Our Payment.id — used as tx_ref
   * @param amountCents Total amount in ZAR cents
   * @param currency    ISO 4217 code
   */
  async createPaymentLink(
    paymentId: string,
    amountCents: number,
    currency: string,
  ): Promise<FlutterwaveCheckoutSession> {
    // ── STUB ──────────────────────────────────────────────────────────────────
    // Replace with: POST ${this.apiBaseUrl}/payments
    //   Authorization: Bearer ${this.secretKey}
    //   { tx_ref: paymentId, amount: amountCents / 100, currency,
    //     redirect_url: `${appBaseUrl}/payment/callback`,
    //     customer: { email, name }, meta: { orderId } }
    // ─────────────────────────────────────────────────────────────────────────

    this.logger.log(
      `[STUB] Flutterwave payment link for payment ${paymentId} (${currency} ${amountCents / 100})`,
      FlutterwaveGateway.CONTEXT,
    );

    return {
      txRef:       paymentId,
      checkoutUrl: `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${paymentId}`,
    };
  }

  /**
   * Validate Flutterwave webhook signature.
   *
   * Flutterwave sends verif-hash header = HMAC-SHA512 of raw body using secret key.
   * Older integrations compare it directly to the configured webhook hash secret.
   */
  validateWebhookSignature(rawBody: Buffer, headers: Record<string, string | undefined>): boolean {
    const verifHash = headers['verif-hash'];
    if (!verifHash) {
      this.logger.warn('Flutterwave webhook missing verif-hash header', FlutterwaveGateway.CONTEXT);
      return false;
    }

    // Modern: HMAC-SHA512 of raw body
    const expected = createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');

    try {
      return timingSafeEqual(Buffer.from(verifHash), Buffer.from(expected));
    } catch {
      // Fallback: plain string comparison (legacy webhook secret)
      return verifHash === this.webhookHash;
    }
  }
}
