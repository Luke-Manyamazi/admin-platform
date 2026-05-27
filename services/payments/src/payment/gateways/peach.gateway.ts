import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { LoggerService } from '../../common/logger/logger.service';

export interface PeachCheckoutSession {
  /** Redirect this URL to the buyer */
  readonly checkoutUrl: string;
  /** Peach checkout ID (their reference) */
  readonly checkoutId: string;
}

/**
 * PeachGateway — Peach Payments integration stub.
 *
 * Peach Payments Checkout API:
 *   POST /v2/checkout
 *   - entityId, amount, currency, paymentType, merchantTransactionId
 *   - Returns a checkout URL for the buyer to complete payment
 *
 * Real implementation replaces the stub methods with actual HTTP calls
 * to process.env.PEACH_API_BASE_URL using process.env.PEACH_ACCESS_TOKEN.
 *
 * Webhook validation uses HMAC-SHA256 with process.env.PEACH_WEBHOOK_SECRET.
 */
@Injectable()
export class PeachGateway {
  private static readonly CONTEXT = 'PeachGateway';

  private readonly apiBaseUrl: string;
  private readonly entityId: string;
  private readonly accessToken: string;
  private readonly webhookSecret: string;

  constructor(private readonly logger: LoggerService) {
    this.apiBaseUrl    = process.env['PEACH_API_BASE_URL']    ?? 'https://testsecure.peachpayments.com';
    this.entityId      = process.env['PEACH_ENTITY_ID']       ?? '';
    this.accessToken   = process.env['PEACH_ACCESS_TOKEN']    ?? '';
    this.webhookSecret = process.env['PEACH_WEBHOOK_SECRET']  ?? 'dev-peach-webhook-secret';
  }

  /**
   * Create a Peach Checkout session for the given payment.
   *
   * @param paymentId   Our Payment.id — used as merchantTransactionId
   * @param amountCents Total amount in ZAR cents
   * @param currency    ISO 4217 code
   * @returns           Checkout URL to redirect the buyer to
   */
  async createCheckoutSession(
    paymentId: string,
    amountCents: number,
    currency: string,
  ): Promise<PeachCheckoutSession> {
    // ── STUB ──────────────────────────────────────────────────────────────────
    // Replace with: POST ${this.apiBaseUrl}/v2/checkout
    //   Authorization: Bearer ${this.accessToken}
    //   { entityId: this.entityId, amount: (amountCents / 100).toFixed(2),
    //     currency, paymentType: 'DB', merchantTransactionId: paymentId }
    // ─────────────────────────────────────────────────────────────────────────

    this.logger.log(
      `[STUB] Peach checkout session for payment ${paymentId} (${currency} ${amountCents / 100})`,
      PeachGateway.CONTEXT,
    );

    const stubCheckoutId = `PEACH-${paymentId.slice(0, 8).toUpperCase()}`;
    return {
      checkoutId:  stubCheckoutId,
      checkoutUrl: `${this.apiBaseUrl}/v2/checkout?id=${stubCheckoutId}&merchantTransactionId=${paymentId}`,
    };
  }

  /**
   * Validate the HMAC signature on an incoming Peach webhook.
   *
   * Peach sends:
   *   X-Initialization-Vector: <base64 IV>
   *   X-Authentication-Tag:    <base64 auth tag>
   *
   * For simplicity this stub validates a plain HMAC-SHA256 of the raw body.
   * Replace with Peach's AES-GCM decryption in production.
   */
  validateWebhookSignature(rawBody: Buffer, headers: Record<string, string | undefined>): boolean {
    // ── STUB — replace with Peach AES-GCM webhook validation ─────────────────
    const signature = headers['x-authentication-tag'];
    if (!signature) {
      this.logger.warn('Peach webhook missing X-Authentication-Tag header', PeachGateway.CONTEXT);
      return false;
    }

    const expected = createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Determine if a Peach result code indicates success.
   * Success codes match /^(000\.000\.|000\.100\.110)/
   */
  isSuccessCode(resultCode: string): boolean {
    return /^(000\.000\.|000\.100\.110)/.test(resultCode);
  }
}
