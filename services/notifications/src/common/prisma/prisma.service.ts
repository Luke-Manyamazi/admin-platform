import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@admin-platform/database';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static readonly CTX = 'PrismaService';

  constructor(private readonly logger: LoggerService) {
    super({
      log:
        process.env['NODE_ENV'] === 'development'
          ? [{ level: 'warn', emit: 'stdout' }, { level: 'error', emit: 'stdout' }]
          : [{ level: 'error', emit: 'stdout' }],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected', PrismaService.CTX);
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected', PrismaService.CTX);
  }
}
