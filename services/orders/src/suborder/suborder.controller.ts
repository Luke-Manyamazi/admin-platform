import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@admin-platform/types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import { SubOrderService } from './suborder.service';
import { DeclineSubOrderDto } from './dto/decline-suborder.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CompleteSubOrderDto } from './dto/complete-suborder.dto';

/**
 * SubOrderController — REST API for sub-order lifecycle.
 *
 * Base path: /api/v1/suborders  (prefix set in main.ts)
 *
 * Readable by BUYER (their order's sub-orders), FACTORY_OWNER (their factory's),
 * and ADMIN (all).
 *
 * Writable by FACTORY_OWNER (for sub-orders on their factory) and ADMIN.
 *
 * Routes:
 *   GET    /order/:orderId          — list sub-orders for a specific order
 *   GET    /factory/:factoryId      — list sub-orders assigned to a factory
 *   POST   /:id/accept              — factory accepts a pending sub-order
 *   POST   /:id/decline             — factory declines a pending sub-order
 *   PATCH  /:id/progress            — factory updates production progress
 *   POST   /:id/complete            — factory marks sub-order as completed
 */
@Controller('suborders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubOrderController {
  constructor(private readonly subOrderService: SubOrderService) {}

  // ── Reads ─────────────────────────────────────────────────────────────────

  @Get('order/:orderId')
  @Roles(Role.BUYER, Role.FACTORY_OWNER, Role.ADMIN)
  async getSubOrdersByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subOrderService.getSubOrdersByOrder(orderId, user);
  }

  @Get('factory/:factoryId')
  @Roles(Role.FACTORY_OWNER, Role.ADMIN)
  async getMySubOrders(
    @Param('factoryId') factoryId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subOrderService.getMySubOrders(factoryId, user);
  }

  // ── Factory lifecycle actions ─────────────────────────────────────────────

  @Post(':id/accept')
  @Roles(Role.FACTORY_OWNER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async acceptSubOrder(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subOrderService.acceptSubOrder(id, user);
  }

  @Post(':id/decline')
  @Roles(Role.FACTORY_OWNER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async declineSubOrder(
    @Param('id') id: string,
    @Body() dto: DeclineSubOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subOrderService.declineSubOrder(id, dto, user);
  }

  @Patch(':id/progress')
  @Roles(Role.FACTORY_OWNER, Role.ADMIN)
  async updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subOrderService.updateProgress(id, dto.progressPercent, user);
  }

  @Post(':id/complete')
  @Roles(Role.FACTORY_OWNER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async completeSubOrder(
    @Param('id') id: string,
    @Body() dto: CompleteSubOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.subOrderService.completeSubOrder(id, dto, user);
  }
}
