import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { DisputeOrderDto } from './dto/dispute-order.dto';

/**
 * OrderController — REST API for order lifecycle.
 *
 * Base path: /api/v1/orders  (prefix set in main.ts)
 *
 * Buyer routes:
 *   GET    /              — list own orders
 *   GET    /:id           — get order detail (with sub-orders)
 *   POST   /              — create draft order
 *   PATCH  /:id           — update draft order
 *   POST   /:id/place     — submit order (DRAFT → PLACED)
 *   POST   /:id/cancel    — cancel order
 *   POST   /:id/confirm-delivery — confirm receipt (DISPATCHED → DELIVERED)
 *   POST   /:id/dispute   — raise dispute (DELIVERED → DISPUTED)
 *
 * Admin-only routes:
 *   POST   /:id/allocate  — trigger AI allocation (PLACED → ALLOCATED)
 */
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ── Buyer & Admin reads ────────────────────────────────────────────────────

  @Get()
  @Roles(Role.BUYER, Role.ADMIN)
  async listOrders(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.orderService.listOrders(query, user);
    return {
      success: true as const,
      data: result.items,
      meta: {
        page:       result.page,
        limit:      result.limit,
        total:      result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  @Roles(Role.BUYER, Role.ADMIN)
  async getOrder(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.getOrder(id, user);
  }

  // ── Buyer writes ──────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.createOrder(dto, user);
  }

  @Patch(':id')
  @Roles(Role.BUYER, Role.ADMIN)
  async updateOrder(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.updateOrder(id, dto, user);
  }

  @Post(':id/place')
  @Roles(Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async placeOrder(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.placeOrder(id, user);
  }

  @Post(':id/cancel')
  @Roles(Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.cancelOrder(id, dto, user);
  }

  @Post(':id/confirm-delivery')
  @Roles(Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async confirmDelivery(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.confirmDelivery(id, user);
  }

  @Post(':id/dispute')
  @Roles(Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async disputeOrder(
    @Param('id') id: string,
    @Body() dto: DisputeOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.disputeOrder(id, dto, user);
  }

  // ── Admin-only ────────────────────────────────────────────────────────────

  @Post(':id/allocate')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async allocateOrder(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.allocateOrder(id, user);
  }
}
