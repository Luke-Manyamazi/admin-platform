import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { SesService } from './ses.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    SesService,
    PrismaService,
    LoggerService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
