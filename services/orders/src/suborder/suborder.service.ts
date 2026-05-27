import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SubOrderStatus, Role } from '@admin-platform/types';
import {
  EVENT_SOURCE,
  DETAIL_TYPE,
  type SubOrderAcceptedEvent,
  type SubOrderDeclinedEvent,
  type SubOrderCompletedEvent,
} from '@admin-platform/events';
import { LoggerService } from '../common/logger/logger.service';
import { EventsService } from '../common/events/events.service';
import { OrderRepository } from '../order/order.repository';
import { OrderService } from '../order/order.service';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import { SubOrderRepository, type SubOrderWithFactory, type SubOrderWithOrder } from './suborder.repository';
import { type DeclineSubOrderDto } from './dto/decline-suborder.dto';
import { type CompleteSubOrderDto } from './dto/complete-suborder.dto';

/**
 * SubOrderService — business logic for sub-order lifecycle.
 *
 * Enforces:
 * - Factory ownership: FACTORY_OWNERs can only act on sub-orders assigned to their factories
 * - Status transitions: only valid moves are allowed
 * - Order cascades: accepting/completing sub-orders triggers order status transitions
 * - Event publishing: typed EventBridge events on each transition
 */
@Injectable()
export class SubOrderService {
  private static readonly CONTEXT = 'SubOrderService';

  constructor(
    private readonly subOrderRepository: SubOrderRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderService: OrderService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────────

  async getSubOrdersByOrder(orderId: string, actor: JwtPayload): Promise<SubOrderWithFactory[]> {
    // Verify order exists and caller has access
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (actor.role !== Role.ADMIN && order.buyerId !== actor.sub) {
      // FACTORY_OWNERs can see sub-orders on their own factories — filter below
      const subOrders = await this.subOrderRepository.findByOrderId(orderId);
      return subOrders.filter((so) => so.factory.ownerId === actor.sub);
    }

    return this.subOrderRepository.findByOrderId(orderId);
  }

  async getMySubOrders(factoryId: string, actor: JwtPayload): Promise<SubOrderWithFactory[]> {
    // Verify the caller owns this factory
    const subOrders = await this.subOrderRepository.findByFactoryId(factoryId);
    if (subOrders.length > 0) {
      this.assertFactoryOwner(subOrders[0]!, actor);
    }
    return subOrders;
  }

  // ── Factory actions ────────────────────────────────────────────────────────

  async acceptSubOrder(id: string, actor: JwtPayload): Promise<SubOrderWithOrder> {
    const subOrder = await this.subOrderRepository.findByIdWithOrder(id);
    if (!subOrder) throw new NotFoundException(`SubOrder ${id} not found`);

    this.assertFactoryOwner(subOrder, actor);

    if (subOrder.status !== SubOrderStatus.PENDING_ACCEPTANCE) {
      throw new ConflictException(
        `SubOrder ${id} cannot be accepted in status '${subOrder.status}'`,
      );
    }

    await this.subOrderRepository.updateStatus(id, SubOrderStatus.ACCEPTED);

    const now = new Date();

    const event: SubOrderAcceptedEvent = {
      source:     EVENT_SOURCE.SUBORDERS,
      detailType: DETAIL_TYPE.SUBORDER_ACCEPTED,
      detail: {
        subOrderId:   subOrder.id,
        orderId:      subOrder.orderId,
        orderNumber:  subOrder.order.orderNumber,
        factoryId:    subOrder.factoryId,
        factoryName:  subOrder.factory.name,
        units:        subOrder.units,
        acceptedAt:   now.toISOString(),
        traceOrderId: subOrder.order.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      subOrder.orderId,
      type:         'SUBORDER_ACCEPTED',
      payload:      { subOrderId: id, factoryId: subOrder.factoryId },
      traceOrderId: subOrder.order.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    // Check if all sub-orders are accepted → transition order to IN_PRODUCTION
    await this.orderService.checkAndTransitionToInProduction(
      subOrder.orderId,
      subOrder.order.traceOrderId,
    );

    this.logger.log(
      `SubOrder ${id} accepted by factory ${subOrder.factoryId} (order: ${subOrder.order.orderNumber})`,
      SubOrderService.CONTEXT,
    );

    return (await this.subOrderRepository.findByIdWithOrder(id))!;
  }

  async declineSubOrder(id: string, dto: DeclineSubOrderDto, actor: JwtPayload): Promise<SubOrderWithOrder> {
    const subOrder = await this.subOrderRepository.findByIdWithOrder(id);
    if (!subOrder) throw new NotFoundException(`SubOrder ${id} not found`);

    this.assertFactoryOwner(subOrder, actor);

    if (subOrder.status !== SubOrderStatus.PENDING_ACCEPTANCE) {
      throw new ConflictException(
        `SubOrder ${id} cannot be declined in status '${subOrder.status}'`,
      );
    }

    await this.subOrderRepository.updateStatus(id, SubOrderStatus.DECLINED);

    const now = new Date();

    const event: SubOrderDeclinedEvent = {
      source:     EVENT_SOURCE.SUBORDERS,
      detailType: DETAIL_TYPE.SUBORDER_DECLINED,
      detail: {
        subOrderId:   subOrder.id,
        orderId:      subOrder.orderId,
        orderNumber:  subOrder.order.orderNumber,
        factoryId:    subOrder.factoryId,
        units:        subOrder.units,
        reason:       dto.reason ?? null,
        declinedAt:   now.toISOString(),
        traceOrderId: subOrder.order.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      subOrder.orderId,
      type:         'SUBORDER_DECLINED',
      payload:      { subOrderId: id, factoryId: subOrder.factoryId, reason: dto.reason ?? null },
      traceOrderId: subOrder.order.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    this.logger.log(
      `SubOrder ${id} declined by factory ${subOrder.factoryId} — re-allocation required`,
      SubOrderService.CONTEXT,
    );

    return (await this.subOrderRepository.findByIdWithOrder(id))!;
  }

  async updateProgress(id: string, progressPercent: number, actor: JwtPayload): Promise<SubOrderWithOrder> {
    const subOrder = await this.subOrderRepository.findByIdWithOrder(id);
    if (!subOrder) throw new NotFoundException(`SubOrder ${id} not found`);

    this.assertFactoryOwner(subOrder, actor);

    const activeStatuses: string[] = [
      SubOrderStatus.ACCEPTED,
      SubOrderStatus.IN_PRODUCTION,
      SubOrderStatus.QUALITY_CHECK,
    ];

    if (!activeStatuses.includes(subOrder.status)) {
      throw new ConflictException(
        `SubOrder ${id} progress cannot be updated in status '${subOrder.status}'`,
      );
    }

    // Auto-transition status based on progress
    let newStatus: SubOrderStatus | undefined;
    if (progressPercent >= 1 && subOrder.status === SubOrderStatus.ACCEPTED) {
      newStatus = SubOrderStatus.IN_PRODUCTION;
    } else if (progressPercent >= 90 && subOrder.status === SubOrderStatus.IN_PRODUCTION) {
      newStatus = SubOrderStatus.QUALITY_CHECK;
    }

    if (newStatus !== undefined) {
      await this.subOrderRepository.updateStatus(id, newStatus);
    }
    await this.subOrderRepository.updateProgress(id, progressPercent);

    this.logger.log(
      `SubOrder ${id} progress: ${progressPercent}%${newStatus ? ` → ${newStatus}` : ''}`,
      SubOrderService.CONTEXT,
    );

    return (await this.subOrderRepository.findByIdWithOrder(id))!;
  }

  async completeSubOrder(id: string, dto: CompleteSubOrderDto, actor: JwtPayload): Promise<SubOrderWithOrder> {
    const subOrder = await this.subOrderRepository.findByIdWithOrder(id);
    if (!subOrder) throw new NotFoundException(`SubOrder ${id} not found`);

    this.assertFactoryOwner(subOrder, actor);

    const completableStatuses: string[] = [
      SubOrderStatus.IN_PRODUCTION,
      SubOrderStatus.QUALITY_CHECK,
    ];

    if (!completableStatuses.includes(subOrder.status)) {
      throw new ConflictException(
        `SubOrder ${id} cannot be completed in status '${subOrder.status}' — must be IN_PRODUCTION or QUALITY_CHECK`,
      );
    }

    await this.subOrderRepository.complete(id);

    const now = new Date();

    const event: SubOrderCompletedEvent = {
      source:     EVENT_SOURCE.SUBORDERS,
      detailType: DETAIL_TYPE.SUBORDER_COMPLETED,
      detail: {
        subOrderId:        subOrder.id,
        orderId:           subOrder.orderId,
        orderNumber:       subOrder.order.orderNumber,
        factoryId:         subOrder.factoryId,
        units:             subOrder.units,
        trackingReference: dto.trackingReference ?? null,
        completedAt:       now.toISOString(),
        traceOrderId:      subOrder.order.traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    await this.orderRepository.appendEvent({
      orderId:      subOrder.orderId,
      type:         'SUBORDER_COMPLETED',
      payload:      { subOrderId: id, factoryId: subOrder.factoryId, trackingReference: dto.trackingReference ?? null },
      traceOrderId: subOrder.order.traceOrderId,
      actorId:      actor.sub,
      actorRole:    actor.role,
    });

    // Check if all sub-orders are done → transition order to DISPATCHED
    await this.orderService.checkAndTransitionToDispatched(
      subOrder.orderId,
      subOrder.order.traceOrderId,
    );

    this.logger.log(
      `SubOrder ${id} completed by factory ${subOrder.factoryId} (order: ${subOrder.order.orderNumber})`,
      SubOrderService.CONTEXT,
    );

    return (await this.subOrderRepository.findByIdWithOrder(id))!;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private assertFactoryOwner(
    subOrder: { factory: { ownerId: string } },
    actor: JwtPayload,
  ): void {
    if (actor.role === Role.ADMIN) return;
    if (subOrder.factory.ownerId !== actor.sub) {
      throw new ForbiddenException('You do not own the factory assigned to this sub-order');
    }
  }
}
