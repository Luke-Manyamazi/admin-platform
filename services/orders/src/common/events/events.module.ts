import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { LoggerService } from '../logger/logger.service';

@Module({
  providers: [EventsService, LoggerService],
  exports: [EventsService],
})
export class EventsModule {}
