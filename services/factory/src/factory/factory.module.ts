import { Module } from '@nestjs/common';
import { FactoryController } from './factory.controller';
import { FactoryService } from './factory.service';
import { FactoryRepository } from './factory.repository';
import { PrismaService } from '../common/prisma/prisma.service';
import { EventsService } from '../common/events/events.service';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  controllers: [FactoryController],
  providers: [
    FactoryService,
    FactoryRepository,
    PrismaService,
    EventsService,
    LoggerService,
  ],
  exports: [FactoryService],
})
export class FactoryModule {}
