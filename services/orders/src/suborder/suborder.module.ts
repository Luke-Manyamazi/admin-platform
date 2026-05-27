import { Module } from '@nestjs/common';
import { SubOrderController } from './suborder.controller';
import { SubOrderService } from './suborder.service';
import { SubOrderRepository } from './suborder.repository';
import { OrderRepository } from '../order/order.repository';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventsService } from '../common/events/events.service';
import { LoggerService } from '../common/logger/logger.service';

/**
 * SubOrderModule — imports OrderModule's service & repository
 * so SubOrderService can trigger order status transitions
 * (e.g. ALLOCATED → IN_PRODUCTION, IN_PRODUCTION → DISPATCHED).
 *
 * OrderService and OrderRepository are declared here as providers
 * (not re-exported from OrderModule) to avoid a circular module dependency.
 */
@Module({
  controllers: [SubOrderController],
  providers: [
    SubOrderService,
    SubOrderRepository,
    OrderRepository,
    OrderService,
    PrismaService,
    EventsService,
    LoggerService,
  ],
})
export class SubOrderModule {}
