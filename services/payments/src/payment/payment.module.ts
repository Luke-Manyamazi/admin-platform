import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PeachGateway } from './gateways/peach.gateway';
import { FlutterwaveGateway } from './gateways/flutterwave.gateway';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventsService } from '../common/events/events.service';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentRepository,
    PeachGateway,
    FlutterwaveGateway,
    PrismaService,
    EventsService,
    LoggerService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
