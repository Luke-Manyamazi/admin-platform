import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@admin-platform/types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import {
  OrderPlacedInternalDto,
  OrderAllocatedInternalDto,
  OrderCompletedInternalDto,
  OrderCancelledInternalDto,
  FactoryVerifiedInternalDto,
  PaymentHeldInternalDto,
  PaymentReleasedInternalDto,
  SubOrderAcceptedInternalDto,
  SubOrderDeclinedInternalDto,
  SubOrderCompletedInternalDto,
} from './dto/internal-events.dto';

/**
 * NotificationController
 *
 * Base path: /api/v1/notifications
 *
 * Internal EventBridge-to-HTTP endpoints (@Public, X-Internal-Secret):
 *   POST /internal/order-placed
 *   POST /internal/order-allocated
 *   POST /internal/order-completed
 *   POST /internal/order-cancelled
 *   POST /internal/factory-verified
 *   POST /internal/payment-held
 *   POST /internal/payment-released
 *   POST /internal/suborder-accepted
 *   POST /internal/suborder-declined
 *   POST /internal/suborder-completed
 *
 * All internal endpoints return 200 regardless of send success to prevent
 * EventBridge from retrying (failures are logged + recorded as FAILED).
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ── Internal EventBridge-to-HTTP endpoints ─────────────────────────────────

  @Post('internal/order-placed')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onOrderPlaced(
    @Body() dto: OrderPlacedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onOrderPlaced(dto);
    return { processed: true };
  }

  @Post('internal/order-allocated')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onOrderAllocated(
    @Body() dto: OrderAllocatedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onOrderAllocated(dto);
    return { processed: true };
  }

  @Post('internal/order-completed')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onOrderCompleted(
    @Body() dto: OrderCompletedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onOrderCompleted(dto);
    return { processed: true };
  }

  @Post('internal/order-cancelled')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onOrderCancelled(
    @Body() dto: OrderCancelledInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onOrderCancelled(dto);
    return { processed: true };
  }

  @Post('internal/factory-verified')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onFactoryVerified(
    @Body() dto: FactoryVerifiedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onFactoryVerified(dto);
    return { processed: true };
  }

  @Post('internal/payment-held')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onPaymentHeld(
    @Body() dto: PaymentHeldInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onPaymentHeld(dto);
    return { processed: true };
  }

  @Post('internal/payment-released')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onPaymentReleased(
    @Body() dto: PaymentReleasedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onPaymentReleased(dto);
    return { processed: true };
  }

  @Post('internal/suborder-accepted')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onSubOrderAccepted(
    @Body() dto: SubOrderAcceptedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onSubOrderAccepted(dto);
    return { processed: true };
  }

  @Post('internal/suborder-declined')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onSubOrderDeclined(
    @Body() dto: SubOrderDeclinedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onSubOrderDeclined(dto);
    return { processed: true };
  }

  @Post('internal/suborder-completed')
  @Public()
  @HttpCode(HttpStatus.OK)
  async onSubOrderCompleted(
    @Body() dto: SubOrderCompletedInternalDto,
    @Headers('x-internal-secret') secret: string | undefined,
  ) {
    this.notificationService.validateInternalSecret(secret);
    await this.notificationService.onSubOrderCompleted(dto);
    return { processed: true };
  }
}
