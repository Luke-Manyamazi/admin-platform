/**
 * @admin-platform/database — Public API
 *
 * Exports the Prisma client class, the Prisma namespace (for input/filter types),
 * and a script-use singleton.
 *
 * ─── For NestJS services ──────────────────────────────────────────────────────
 *
 *   Create a PrismaService in your service that extends PrismaClient:
 *
 *   import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
 *   import { PrismaClient } from '@admin-platform/database';
 *
 *   @Injectable()
 *   export class PrismaService
 *     extends PrismaClient
 *     implements OnModuleInit, OnModuleDestroy
 *   {
 *     async onModuleInit(): Promise<void> {
 *       await this.$connect();
 *     }
 *
 *     async onModuleDestroy(): Promise<void> {
 *       await this.$disconnect();
 *     }
 *   }
 *
 * ─── For Prisma input/filter types ───────────────────────────────────────────
 *
 *   import type { Prisma } from '@admin-platform/database';
 *
 *   // Repository create input:
 *   type CreateFactoryInput = Prisma.FactoryCreateInput;
 *
 *   // Where clause:
 *   type FactoryWhereInput = Prisma.FactoryWhereInput;
 *
 * ─── For scripts and seed files only ────────────────────────────────────────
 *
 *   import { prisma } from '@admin-platform/database';
 *   // Use prisma.user.findMany() etc.
 */

// ─── Prisma client class ──────────────────────────────────────────────────────

export { PrismaClient } from './generated/client';

// ─── Prisma namespace — create/update/filter input types ─────────────────────

export type { Prisma } from './generated/client';

// ─── Singleton — scripts and seed files only ─────────────────────────────────
// DO NOT import this in NestJS services — use PrismaService instead.

export { prisma } from './client';
