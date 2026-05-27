import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventsService } from '../common/events/events.service';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    PrismaService,
    EventsService,
    LoggerService,
  ],
  exports: [OrderService],
})
export class OrderModule {}
