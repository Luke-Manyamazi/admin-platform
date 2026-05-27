import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, LoggerService],
})
export class AuthModule {}
