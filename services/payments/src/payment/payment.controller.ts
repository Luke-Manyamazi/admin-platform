import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { type Request } from 'express';
import { Role } from '@admin-platform/types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PeachWebhookDto } from './dto/peach-webhook.dto';
import { FlutterwaveWebhookDto } from './dto/flutterwave-webhook.dto';
import { OrderCompletedInternalDto, OrderCancelledInternalDto } from './dto/internal-event.dto';

/**
 * PaymentController — REST API for the escrow payment lifecycle.
 *
 * Base path: /api/v1/payments  (prefix set in main.ts)
 *
 * Buyer / Admin routes:
 *   POST  /initiate               — create checkout session for a PLACED order
 *   GET   /order/:orderId         — get payment status for an order
 *
 * Webhook routes (@Public — validated by HMAC/hash, not JWT):
 *   POST  /webhook/peach          — Peach Payments callback
 *   POST  /webhook/flutterwave    — Flutterwave callback
 *
 * Internal event routes (@Public — validated by X-Internal-Secret header):
 *   POST  /internal/order-completed  — EventBridge trigger on OrderCompleted
 *   POST  /internal/order-cancelled  — EventBridge trigger on OrderCancelled
 *
 * Admin overrides:
 *   POST  /:id/release            — manually release escrow (ADMIN)
 *   POST  /:id/refund             — manually trigger refund (ADMIN)
 */
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ── Buyer reads ───────────────────────────────────────────────────────────

  @Get('order/:orderId')
  @Roles(Role.BUYER, Role.ADMIN)
  async getPaymentByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentService.getPaymentByOrder(orderId, user);
  }

  // ── Buyer initiation ──────────────────────────────────────────────────────

  @Post('initiate')
  @Roles(Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentService.initiatePayment(dto, user);
  }

  // ── Gateway webhooks (@Public — HMAC validated in service) ────────────────

  @Post('webhook/peach')
  @Public()
  @HttpCode(HttpStatus.OK)
  async peachWebhook(
    @Body() dto: PeachWebhookDto,
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
  ) {
    await this.paymentService.processPeachWebhook(
      req.body as Buffer,
      headers,
      dto,
    );
    return { received: true };
  }

  @Post('webhook/flutterwave')
  @Public()
  @HttpCode(HttpStatus.OK)
  async flutterwaveWebhook(
    @Body() dto: FlutterwaveWebhookDto,
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
  ) {
    await this.paymentService.processFlutterwaveWebhook(
      req.body as Buffer,
      headers,
      dto,
    );
    return { received: true };
  }

  // ── Internal EventBridge-to-HTTP endpoints ────────────────────────────────

  @Post('internal/order-completed')
  @Public()
  @HttpCode(HttpStatus.OK)
  async internalOrderCompleted(
    @Body() dto: OrderCompletedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.paymentService.validateInternalSecret(secret);
    await this.paymentService.handleOrderCompleted(dto);
    return { processed: true };
  }

  @Post('internal/order-cancelled')
  @Public()
  @HttpCode(HttpStatus.OK)
  async internalOrderCancelled(
    @Body() dto: OrderCancelledInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.paymentService.validateInternalSecret(secret);
    await this.paymentService.handleOrderCancelled(dto);
    return { processed: true };
  }

  // ── Admin overrides ───────────────────────────────────────────────────────

  @Post(':id/release')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async releasePayment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentService.adminReleasePayment(id, user);
  }

  @Post(':id/refund')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentService.adminRefundPayment(id, user);
  }
}
