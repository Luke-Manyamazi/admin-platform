import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@admin-platform/database';
import { LoggerService } from '../logger/logger.service';

/**
 * PrismaService — NestJS-managed Prisma client.
 *
 * Extends PrismaClient so all model accessors (this.factory, this.user, etc.)
 * are available directly. Implements OnModuleInit / OnModuleDestroy for proper
 * connection lifecycle management.
 *
 * Import via PrismaModule.forRoot() in every service that needs DB access.
 * NEVER import the `prisma` singleton from @admin-platform/database in NestJS code.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static readonly CONTEXT = 'PrismaService';

  constructor(private readonly logger: LoggerService) {
    super({
      log:
        process.env['NODE_ENV'] === 'development'
          ? [
              { level: 'query', emit: 'event' },
              { level: 'warn', emit: 'stdout' },
              { level: 'error', emit: 'stdout' },
            ]
          : [
              { level: 'warn', emit: 'stdout' },
              { level: 'error', emit: 'stdout' },
            ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected', PrismaService.CONTEXT);
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected', PrismaService.CONTEXT);
  }
}
