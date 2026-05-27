import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { type Factory } from '@admin-platform/database';
import { OrderStatus, Role } from '@admin-platform/types';
import {
  EVENT_SOURCE,
  DETAIL_TYPE,
  type OrderPlacedEvent,
  type OrderAllocatedEvent,
  type OrderCompletedEvent,
  type OrderCancelledEvent,
  type OrderDisputedEvent,
} from '@admin-platform/events';
import { LoggerService } from '../common/logger/logger.service';
import { EventsService } from '../common/events/events.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import {
  OrderRepository,
  type OrderWithSubOrders,
  type PaginatedOrders,
} from './order.repository';
import { type CreateOrderDto } from './dto/create-order.dto';
import { type UpdateOrderDto } from './dto/update-order.dto';
import { type OrderQueryDto } from './dto/order-query.dto';
import { type CancelOrderDto } from './dto/cancel-order.dto';
import { type DisputeOrderDto } from './dto/dispute-order.dto';

/** Minimum lead time in milliseconds (3 days) */
const MIN_LEAD_TIME_MS = 3 * 24 * 60 * 60 * 1000;

/** Maximum factories to split an order across */
const MAX_ALLOCATION_FACTORIES = 3;

/**
 * OrderService — business logic layer.
 *
 * Enforces:
 * - Ownership: BUYERs can only read/modify their own orders
 * - Status transitions: only valid moves are allowed
 * - Event publishing: typed EventBridge events on each major transition
 * - Audit trail: OrderEvent appended on every status change
 *
 * No Prisma calls here — all DB access goes via OrderRepository.
 */
@Injectable()
export class OrderService {
  private static readonly CONTEXT = 'OrderService';

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventsService: EventsService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────────

  async getOrder(id: string, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    this.assertBuyerOrAdmin(order.buyerId, actor);
    return order;
  }

  async listOrders(query: OrderQueryDto, actor: JwtPayload): Promise<PaginatedOrders> {
    // BUYERs see only their own orders; ADMINs see all
    const buyerId = actor.role === Role.ADMIN ? undefined : actor.sub;
    return this.orderRepository.findMany(query, buyerId);
  }

  // ── Lifecycle — buyer actions ──────────────────────────────────────────────

  async createOrder(dto: CreateOrderDto, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const deadlineDate = new Date(dto.deadline);
    if (deadlineDate.getTime() - Date.now() < MIN_LEAD_TIME_MS) {
      throw new BadRequestException('Deadline must be at least 3 days in the future');
    }

    const order = await this.orderRepository.create(dto, actor.sub);

    await this.orderRepository.appendEvent({
      orderId:      order.id,
      type:         'ORDER_CREATED',
      payload:      { buyerId: actor.sub, orderNumber: order.orderNumber },
      traceOrderId: order.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(
      `Order created: ${order.orderNumber} (${order.id}) by buyer ${actor.sub}`,
      OrderService.CONTEXT,
    );

    return order;
  }

  async updateOrder(id: string, dto: UpdateOrderDto, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    this.assertBuyerOrAdmin(order.buyerId, actor);

    if (order.status !== OrderStatus.DRAFT) {
      throw new ConflictException(
        `Order ${order.orderNumber} cannot be edited in status '${order.status}' — only DRAFT orders can be updated`,
      );
    }

    const updated = await this.orderRepository.update(id, dto);

    await this.orderRepository.appendEvent({
      orderId:      id,
      type:         'ORDER_UPDATED',
      payload:      { fields: Object.keys(dto) },
      traceOrderId: order.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(`Order updated: ${order.orderNumber} by ${actor.sub}`, OrderService.CONTEXT);

    return updated;
  }

  async placeOrder(id: string, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    this.assertBuyerOrAdmin(order.buyerId, actor);

    if (order.status !== OrderStatus.DRAFT) {
      throw new ConflictException(
        `Order ${order.orderNumber} is already in status '${order.status}'`,
      );
    }

    const placed = await this.orderRepository.updateStatus(id, OrderStatus.PLACED);

    const event: OrderPlacedEvent = {
      source:     EVENT_SOURCE.ORDERS,
      detailType: DETAIL_TYPE.ORDER_PLACED,
      detail: {
        orderId:         placed.id,
        orderNumber:     placed.orderNumber,
        buyerId:         placed.buyerId,
        totalValue:      placed.totalValue,
        currency:        placed.currency,
        deadline:        placed.deadline.toISOString(),
        productName:     placed.productName,
        productCategory: placed.productCategory,
        traceOrderId:    placed.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      id,
      type:         'ORDER_PLACED',
      payload:      { totalValue: placed.totalValue, currency: placed.currency },
      traceOrderId: placed.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(
      `Order placed: ${placed.orderNumber} (trace: ${placed.traceOrderId})`,
      OrderService.CONTEXT,
    );

    return placed;
  }

  async cancelOrder(id: string, dto: CancelOrderDto, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    this.assertBuyerOrAdmin(order.buyerId, actor);

    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.DRAFT,
      OrderStatus.PLACED,
      OrderStatus.ALLOCATING,
      OrderStatus.ALLOCATED,
    ];

    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new ConflictException(
        `Order ${order.orderNumber} cannot be cancelled in status '${order.status}'`,
      );
    }

    const cancelled = await this.orderRepository.updateStatus(id, OrderStatus.CANCELLED);

    const paymentWasHeld = false; // Determined by payments-service; default false here

    const event: OrderCancelledEvent = {
      source:     EVENT_SOURCE.ORDERS,
      detailType: DETAIL_TYPE.ORDER_CANCELLED,
      detail: {
        orderId:        cancelled.id,
        orderNumber:    cancelled.orderNumber,
        buyerId:        cancelled.buyerId,
        reason:         dto.reason,
        paymentWasHeld,
        cancelledAt:    new Date().toISOString(),
        traceOrderId:   cancelled.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      id,
      type:         'ORDER_CANCELLED',
      payload:      { reason: dto.reason, previousStatus: order.status },
      traceOrderId: cancelled.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(
      `Order cancelled: ${cancelled.orderNumber} by ${actor.sub}`,
      OrderService.CONTEXT,
    );

    return cancelled;
  }

  async confirmDelivery(id: string, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    this.assertBuyerOrAdmin(order.buyerId, actor);

    if (order.status !== OrderStatus.DISPATCHED) {
      throw new ConflictException(
        `Order ${order.orderNumber} must be in DISPATCHED status to confirm delivery (current: '${order.status}')`,
      );
    }

    const now = new Date();
    const delivered = await this.orderRepository.updateStatus(id, OrderStatus.DELIVERED);

    const event: OrderCompletedEvent = {
      source:     EVENT_SOURCE.ORDERS,
      detailType: DETAIL_TYPE.ORDER_COMPLETED,
      detail: {
        orderId:      delivered.id,
        orderNumber:  delivered.orderNumber,
        buyerId:      delivered.buyerId,
        totalValue:   delivered.totalValue,
        currency:     delivered.currency,
        completedAt:  now.toISOString(),
        traceOrderId: delivered.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      id,
      type:         'ORDER_DELIVERED',
      payload:      { confirmedAt: now.toISOString() },
      traceOrderId: delivered.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(
      `Order delivered: ${delivered.orderNumber} confirmed by buyer ${actor.sub}`,
      OrderService.CONTEXT,
    );

    return delivered;
  }

  async disputeOrder(id: string, dto: DisputeOrderDto, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    this.assertBuyerOrAdmin(order.buyerId, actor);

    if (order.status !== OrderStatus.DELIVERED) {
      throw new ConflictException(
        `Order ${order.orderNumber} must be in DELIVERED status to raise a dispute (current: '${order.status}')`,
      );
    }

    const now = new Date();
    const disputed = await this.orderRepository.updateStatus(id, OrderStatus.DISPUTED);

    const event: OrderDisputedEvent = {
      source:     EVENT_SOURCE.ORDERS,
      detailType: DETAIL_TYPE.ORDER_DISPUTED,
      detail: {
        orderId:      disputed.id,
        orderNumber:  disputed.orderNumber,
        buyerId:      disputed.buyerId,
        reason:       dto.reason,
        disputedAt:   now.toISOString(),
        traceOrderId: disputed.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      id,
      type:         'ORDER_DISPUTED',
      payload:      { reason: dto.reason, disputedAt: now.toISOString() },
      traceOrderId: disputed.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(
      `Order disputed: ${disputed.orderNumber} by buyer ${actor.sub}`,
      OrderService.CONTEXT,
    );

    return disputed;
  }

  // ── Allocation (Admin) ─────────────────────────────────────────────────────

  /**
   * allocateOrder — Cassava AI allocation stub.
   *
   * Real implementation: POST to Cassava AI API with order specs →
   * receives an allocation plan → create SubOrders.
   *
   * Stub implementation: find top VERIFIED factories by trust score,
   * split units equally (up to MAX_ALLOCATION_FACTORIES).
   *
   * The stub uses the orders service's own Prisma client to query factories
   * because factory-service is a separate microservice. In production,
   * this would call the factory-service or read from a read model.
   */
  async allocateOrder(id: string, actor: JwtPayload): Promise<OrderWithSubOrders> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    if (order.status !== OrderStatus.PLACED) {
      throw new ConflictException(
        `Order ${order.orderNumber} must be in PLACED status to allocate (current: '${order.status}')`,
      );
    }

    // Mark as ALLOCATING immediately
    await this.orderRepository.updateStatus(id, OrderStatus.ALLOCATING);

    await this.orderRepository.appendEvent({
      orderId:      id,
      type:         'ORDER_ALLOCATING',
      payload:      { triggeredBy: actor.sub },
      traceOrderId: order.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    // ── Stub: find top VERIFIED factories by trust score ────────────────────
    const factories = await this.prisma.factory.findMany({
      where: { status: 'VERIFIED' },
      orderBy: { trustScore: 'desc' },
      take: MAX_ALLOCATION_FACTORIES,
    });

    if (factories.length === 0) {
      // Revert to PLACED so it can be retried
      await this.orderRepository.updateStatus(id, OrderStatus.PLACED);
      throw new ConflictException('No verified factories available for allocation');
    }

    // ── Split units across factories ────────────────────────────────────────
    const subOrderInputs = this.splitUnits(order.quantityUnits, order.deadline, factories);

    // ── Create sub-orders & move to ALLOCATED ──────────────────────────────
    await this.orderRepository.createSubOrders(id, subOrderInputs);
    const allocated = await this.orderRepository.updateStatus(id, OrderStatus.ALLOCATED);

    const event: OrderAllocatedEvent = {
      source:     EVENT_SOURCE.ORDERS,
      detailType: DETAIL_TYPE.ORDER_ALLOCATED,
      detail: {
        orderId:      allocated.id,
        orderNumber:  allocated.orderNumber,
        buyerId:      allocated.buyerId,
        subOrders:    allocated.subOrders.map((so) => ({
          subOrderId: so.id,
          factoryId:  so.factoryId,
          units:      so.units,
          deadline:   so.deadline.toISOString(),
        })),
        traceOrderId: allocated.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      id,
      type:         'ORDER_ALLOCATED',
      payload:      {
        factoryCount: factories.length,
        subOrderIds:  allocated.subOrders.map((so) => so.id),
      },
      traceOrderId: allocated.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(
      `Order allocated: ${allocated.orderNumber} across ${factories.length} factories (trace: ${allocated.traceOrderId})`,
      OrderService.CONTEXT,
    );

    return allocated;
  }

  // ── Order → IN_PRODUCTION transition (triggered by suborder events) ────────

  /**
   * Called by SubOrderService when a sub-order is accepted.
   * If all sub-orders for the order are now ACCEPTED → move to IN_PRODUCTION.
   */
  async checkAndTransitionToInProduction(orderId: string, traceOrderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.status !== OrderStatus.ALLOCATED) return;

    const allAccepted = order.subOrders.every(
      (so) => so.status === 'ACCEPTED' || so.status === 'IN_PRODUCTION' || so.status === 'QUALITY_CHECK' || so.status === 'COMPLETED',
    );

    if (allAccepted && order.subOrders.length > 0) {
      await this.orderRepository.updateStatus(orderId, OrderStatus.IN_PRODUCTION);

      await this.orderRepository.appendEvent({
        orderId,
        type:         'ORDER_IN_PRODUCTION',
        payload:      { allSubOrdersAccepted: true },
        traceOrderId,
      });

      this.logger.log(
        `Order ${order.orderNumber} → IN_PRODUCTION (all sub-orders accepted)`,
        OrderService.CONTEXT,
      );
    }
  }

  /**
   * Called by SubOrderService when a sub-order is completed.
   * If all sub-orders for the order are now COMPLETED → move to DISPATCHED.
   */
  async checkAndTransitionToDispatched(orderId: string, traceOrderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) return;

    const inProgressStatuses = ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'DECLINED', 'FAILED'];
    const allDone = order.subOrders.every(
      (so) => !inProgressStatuses.includes(so.status),
    );
    const anyCompleted = order.subOrders.some((so) => so.status === 'COMPLETED');

    if (allDone && anyCompleted) {
      await this.orderRepository.updateStatus(orderId, OrderStatus.DISPATCHED);

      await this.orderRepository.appendEvent({
        orderId,
        type:         'ORDER_DISPATCHED',
        payload:      { allSubOrdersCompleted: true },
        traceOrderId,
      });

      this.logger.log(
        `Order ${order.orderNumber} → DISPATCHED (all sub-orders completed)`,
        OrderService.CONTEXT,
      );
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private splitUnits(
    totalUnits: number,
    orderDeadline: Date,
    factories: Factory[],
  ): Array<{ factoryId: string; units: number; deadline: Date; trustScoreAtAllocation: number }> {
    const n = factories.length;
    const base = Math.floor(totalUnits / n);
    const remainder = totalUnits % n;

    return factories.map((factory, idx) => ({
      factoryId:             factory.id,
      units:                 base + (idx === 0 ? remainder : 0), // first factory absorbs remainder
      deadline:              orderDeadline,
      trustScoreAtAllocation: factory.trustScore,
    }));
  }

  private assertBuyerOrAdmin(buyerId: string, actor: JwtPayload): void {
    if (actor.role === Role.ADMIN) return;
    if (buyerId !== actor.sub) {
      throw new ForbiddenException('You do not have access to this order');
    }
  }
}
