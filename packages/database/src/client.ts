import { PrismaClient } from './generated/client';

/**
 * Prisma client configuration.
 *
 * In NestJS services, use a PrismaService that extends PrismaClient and
 * implements OnModuleInit / OnModuleDestroy to manage the connection lifecycle.
 * That service lives in each microservice — NOT here.
 *
 * This singleton is for:
 *   - Seed scripts (pnpm db:seed)
 *   - One-off data migration scripts
 *   - Integration tests
 *   - The Prisma Studio dev tool
 *
 * NestJS services should NEVER import this singleton — they must use
 * their own PrismaService for proper lifecycle management.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? [
            { level: 'query', emit: 'stdout' },
            { level: 'info', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
          ]
        : [
            { level: 'warn', emit: 'stdout' },
            { level: 'error', emit: 'stdout' },
          ],
  });

// Prevent multiple PrismaClient instances in development (hot-reloading)
if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
