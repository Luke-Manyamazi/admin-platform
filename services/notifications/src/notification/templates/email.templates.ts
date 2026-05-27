/**
 * Email Templates — transactional email HTML for every ADMIN platform event.
 *
 * Each template function returns { subject, html, text } for AWS SES.
 * Design: simple, mobile-friendly, brand-consistent (ADMIN / Camluk Technologies).
 *
 * In production replace the inline CSS with a proper email framework (MJML, Cerberus)
 * or load from S3. For now, inline styles ensure compatibility with all email clients.
 */

const BRAND_COLOR = '#1A56DB';
const PORTAL_URL = process.env['BUYER_PORTAL_URL'] ?? 'https://admin-platform.camluk.com';
const FACTORY_URL = process.env['FACTORY_PORTAL_URL'] ?? 'https://admin-platform.camluk.com/factory';

// ─── Base layout ─────────────────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:24px 32px;">
              <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ADMIN</span>
              <span style="color:#93c5fd;font-size:13px;margin-left:8px;">by Camluk Technologies</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} Camluk Technologies (Pty) Ltd · South Africa<br/>
                <a href="${PORTAL_URL}" style="color:${BRAND_COLOR};text-decoration:none;">admin-platform.camluk.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;
    padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;
    margin-top:16px;">${text}</a>`;
}

function h2(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:20px;color:#111827;">${text}</h2>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`;
}

function dl(items: [string, string][]): string {
  const rows = items
    .map(([k, v]) => `
      <tr>
        <td style="padding:6px 16px 6px 0;font-size:13px;color:#6b7280;white-space:nowrap;">${k}</td>
        <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${v}</td>
      </tr>`)
    .join('');
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;
}

// ─── Money formatting ─────────────────────────────────────────────────────────

function zarCents(cents: number): string {
  return `R ${(cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface EmailContent {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

// ── ORDER_PLACED → buyer ─────────────────────────────────────────────────────

export function orderPlacedBuyer(data: {
  buyerName: string;
  orderNumber: string;
  productName: string;
  totalValue: number;
  currency: string;
  deadline: string;
}): EmailContent {
  const subject = `Order ${data.orderNumber} received — we're on it!`;
  const html = layout(subject, `
    ${h2(`Hi ${data.buyerName}, your order is in!`)}
    ${p(`We've received <strong>${data.orderNumber}</strong> and our Cassava AI engine is now finding the best-matched factories to fulfil it.`)}
    ${dl([
      ['Order',      data.orderNumber],
      ['Product',    data.productName],
      ['Value',      `${zarCents(data.totalValue)} ${data.currency}`],
      ['Deadline',   new Date(data.deadline).toLocaleDateString('en-ZA', { dateStyle: 'long' })],
    ])}
    ${p(`You'll receive another email once factories have been confirmed and production begins.`)}
    ${btn('Track your order', `${PORTAL_URL}/orders`)}
  `);
  return { subject, html, text: `Order ${data.orderNumber} received. Value: ${zarCents(data.totalValue)}.` };
}

// ── ORDER_ALLOCATED → factory (sub-order assignment) ─────────────────────────

export function subOrderAssignedFactory(data: {
  factoryOwnerName: string;
  factoryName: string;
  orderNumber: string;
  productName: string;
  units: number;
  deadline: string;
  subOrderId: string;
}): EmailContent {
  const subject = `New sub-order assigned: ${data.orderNumber}`;
  const html = layout(subject, `
    ${h2(`Hi ${data.factoryOwnerName}, you have a new sub-order`)}
    ${p(`ADMIN has assigned a production sub-order from <strong>${data.orderNumber}</strong> to <strong>${data.factoryName}</strong>.`)}
    ${dl([
      ['Order',    data.orderNumber],
      ['Product',  data.productName],
      ['Units',    data.units.toLocaleString()],
      ['Deadline', new Date(data.deadline).toLocaleDateString('en-ZA', { dateStyle: 'long' })],
    ])}
    ${p(`Please accept or decline this sub-order within 24 hours. Accepting confirms your commitment to deliver by the deadline.`)}
    ${btn('Accept or decline', `${FACTORY_URL}/suborders/${data.subOrderId}`)}
  `);
  return { subject, html, text: `New sub-order ${data.subOrderId} for ${data.units} units of ${data.productName}. Deadline: ${data.deadline}.` };
}

// ── SUBORDER_ACCEPTED → buyer ─────────────────────────────────────────────────

export function subOrderAcceptedBuyer(data: {
  buyerName: string;
  orderNumber: string;
  factoryName: string;
  units: number;
  productName: string;
}): EmailContent {
  const subject = `Factory confirmed for ${data.orderNumber}`;
  const html = layout(subject, `
    ${h2(`Good news, ${data.buyerName}!`)}
    ${p(`<strong>${data.factoryName}</strong> has accepted their portion of order <strong>${data.orderNumber}</strong> and production is underway.`)}
    ${dl([
      ['Factory', data.factoryName],
      ['Units',   data.units.toLocaleString()],
      ['Product', data.productName],
    ])}
    ${btn('Track your order', `${PORTAL_URL}/orders`)}
  `);
  return { subject, html, text: `${data.factoryName} accepted ${data.units} units for ${data.orderNumber}.` };
}

// ── SUBORDER_DECLINED → buyer ─────────────────────────────────────────────────

export function subOrderDeclinedBuyer(data: {
  buyerName: string;
  orderNumber: string;
  units: number;
}): EmailContent {
  const subject = `Re-allocating ${data.units} units for ${data.orderNumber}`;
  const html = layout(subject, `
    ${h2(`We're re-matching factories for you`)}
    ${p(`A factory has declined their portion of <strong>${data.orderNumber}</strong>. Don't worry — our Cassava AI engine is already finding a replacement and will have it sorted shortly.`)}
    ${dl([
      ['Order', data.orderNumber],
      ['Units being re-allocated', data.units.toLocaleString()],
    ])}
    ${p(`We'll notify you as soon as the re-allocation is confirmed.`)}
    ${btn('Track your order', `${PORTAL_URL}/orders`)}
  `);
  return { subject, html, text: `Re-allocating ${data.units} units for ${data.orderNumber}.` };
}

// ── ORDER_COMPLETED → buyer ───────────────────────────────────────────────────

export function orderCompletedBuyer(data: {
  buyerName: string;
  orderNumber: string;
  productName: string;
  totalValue: number;
  currency: string;
}): EmailContent {
  const subject = `${data.orderNumber} delivered — thank you!`;
  const html = layout(subject, `
    ${h2(`Your order has been delivered, ${data.buyerName}!`)}
    ${p(`Order <strong>${data.orderNumber}</strong> is marked as delivered and escrow funds have been released to your factories.`)}
    ${dl([
      ['Order',   data.orderNumber],
      ['Product', data.productName],
      ['Value',   `${zarCents(data.totalValue)} ${data.currency}`],
    ])}
    ${p(`If you have any issues with the goods received, you can raise a dispute within 7 days.`)}
    ${btn('View order', `${PORTAL_URL}/orders`)}
  `);
  return { subject, html, text: `Order ${data.orderNumber} delivered. Value: ${zarCents(data.totalValue)}.` };
}

// ── PAYMENT_RELEASED → factory owner ─────────────────────────────────────────

export function paymentReleasedFactory(data: {
  factoryOwnerName: string;
  factoryName: string;
  orderNumber: string;
  amount: number;
  currency: string;
}): EmailContent {
  const subject = `Payout processed: ${zarCents(data.amount)} for ${data.orderNumber}`;
  const html = layout(subject, `
    ${h2(`Payout on its way, ${data.factoryOwnerName}!`)}
    ${p(`The escrow funds for your contribution to <strong>${data.orderNumber}</strong> have been released.`)}
    ${dl([
      ['Factory',  data.factoryName],
      ['Order',    data.orderNumber],
      ['Payout',   `${zarCents(data.amount)} ${data.currency}`],
    ])}
    ${p(`Funds will appear in your registered bank account within 2–5 business days depending on your gateway settlement cycle.`)}
    ${btn('View in portal', `${FACTORY_URL}`)}
  `);
  return { subject, html, text: `Payout of ${zarCents(data.amount)} for order ${data.orderNumber}.` };
}

// ── ORDER_CANCELLED → buyer ───────────────────────────────────────────────────

export function orderCancelledBuyer(data: {
  buyerName: string;
  orderNumber: string;
  reason: string;
  refundIssued: boolean;
}): EmailContent {
  const subject = `Order ${data.orderNumber} cancelled`;
  const refundNote = data.refundIssued
    ? `<p style="margin:0 0 12px;font-size:15px;color:#374151;">A full refund has been initiated and will appear within 5–7 business days.</p>`
    : '';
  const html = layout(subject, `
    ${h2(`Order ${data.orderNumber} has been cancelled`)}
    ${p(`Your order has been cancelled${data.reason ? ` — reason: "${data.reason}"` : ''}.`)}
    ${refundNote}
    ${btn('Place a new order', `${PORTAL_URL}/orders/new`)}
  `);
  return { subject, html, text: `Order ${data.orderNumber} cancelled. Refund issued: ${String(data.refundIssued)}.` };
}

// ── ORDER_CANCELLED → affected factory ───────────────────────────────────────

export function orderCancelledFactory(data: {
  factoryOwnerName: string;
  factoryName: string;
  orderNumber: string;
}): EmailContent {
  const subject = `Sub-order cancelled: ${data.orderNumber}`;
  const html = layout(subject, `
    ${h2(`Sub-order for ${data.orderNumber} cancelled`)}
    ${p(`Hi ${data.factoryOwnerName}, the buyer has cancelled order <strong>${data.orderNumber}</strong>. Your sub-order assigned to <strong>${data.factoryName}</strong> has been cancelled.`)}
    ${p(`No further action is required. You will not be penalised for this cancellation.`)}
  `);
  return { subject, html, text: `Sub-order for order ${data.orderNumber} has been cancelled.` };
}

// ── FACTORY_VERIFIED → factory owner ─────────────────────────────────────────

export function factoryVerifiedOwner(data: {
  factoryOwnerName: string;
  factoryName: string;
}): EmailContent {
  const subject = `${data.factoryName} is now verified on ADMIN!`;
  const html = layout(subject, `
    ${h2(`Congratulations, ${data.factoryOwnerName}!`)}
    ${p(`<strong>${data.factoryName}</strong> has passed all verification checks and is now an approved factory on the ADMIN platform.`)}
    ${p(`You are now eligible to receive sub-orders from buyers across Africa. Our Cassava AI engine will start matching your factory based on your capabilities and trust score.`)}
    ${btn('Go to your factory dashboard', `${FACTORY_URL}`)}
  `);
  return { subject, html, text: `${data.factoryName} has been verified on ADMIN.` };
}

// ── PAYMENT_HELD → buyer ──────────────────────────────────────────────────────

export function paymentHeldBuyer(data: {
  buyerName: string;
  orderNumber: string;
  amount: number;
  currency: string;
}): EmailContent {
  const subject = `Payment confirmed for ${data.orderNumber}`;
  const html = layout(subject, `
    ${h2(`Payment received, ${data.buyerName}!`)}
    ${p(`Your payment for <strong>${data.orderNumber}</strong> has been captured and is held in escrow. Funds will only be released to factories once you confirm delivery.`)}
    ${dl([
      ['Order',  data.orderNumber],
      ['Amount', `${zarCents(data.amount)} ${data.currency}`],
      ['Status', 'Held in escrow'],
    ])}
    ${btn('Track your order', `${PORTAL_URL}/orders`)}
  `);
  return { subject, html, text: `Payment of ${zarCents(data.amount)} held for order ${data.orderNumber}.` };
}

// ── SUBORDER_COMPLETED → buyer ────────────────────────────────────────────────

export function subOrderCompletedBuyer(data: {
  buyerName: string;
  orderNumber: string;
  factoryName: string;
  units: number;
  trackingReference: string | null;
}): EmailContent {
  const trackingLine = data.trackingReference
    ? `<tr><td style="padding:6px 16px 6px 0;font-size:13px;color:#6b7280;">Tracking ref</td><td style="padding:6px 0;font-size:13px;font-weight:600;">${data.trackingReference}</td></tr>`
    : '';
  const subject = `Shipment dispatched from ${data.factoryName} — ${data.orderNumber}`;
  const html = layout(subject, `
    ${h2(`A shipment is on its way, ${data.buyerName}!`)}
    ${p(`<strong>${data.factoryName}</strong> has dispatched <strong>${data.units.toLocaleString()} units</strong> for order <strong>${data.orderNumber}</strong>.`)}
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="padding:6px 16px 6px 0;font-size:13px;color:#6b7280;">Factory</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;">${data.factoryName}</td>
      </tr>
      <tr>
        <td style="padding:6px 16px 6px 0;font-size:13px;color:#6b7280;">Units</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;">${data.units.toLocaleString()}</td>
      </tr>
      ${trackingLine}
    </table>
    ${p(`Once all shipments arrive, please confirm delivery in the portal so factories receive their payment.`)}
    ${btn('Confirm delivery', `${PORTAL_URL}/orders`)}
  `);
  return { subject, html, text: `${data.factoryName} dispatched ${data.units} units for ${data.orderNumber}.` };
}
