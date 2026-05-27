import { Injectable } from '@nestjs/common';
import { type SubOrder, type Prisma } from '@admin-platform/database';
import { SubOrderStatus } from '@admin-platform/types';
import { PrismaService } from '../common/prisma/prisma.service';

// ─── Result types ─────────────────────────────────────────────────────────────

export type SubOrderWithFactory = Prisma.SubOrderGetPayload<{
  include: { factory: true };
}>;

export type SubOrderWithOrder = Prisma.SubOrderGetPayload<{
  include: { order: true; factory: true };
}>;

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * SubOrderRepository — the ONLY place that calls Prisma for sub-order data.
 */
@Injectable()
export class SubOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reads ────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<SubOrderWithFactory | null> {
    return this.prisma.subOrder.findUnique({
      where: { id },
      include: { factory: true },
    });
  }

  async findByIdWithOrder(id: string): Promise<SubOrderWithOrder | null> {
    return this.prisma.subOrder.findUnique({
      where: { id },
      include: { order: true, factory: true },
    });
  }

  async findByOrderId(orderId: string): Promise<SubOrderWithFactory[]> {
    return this.prisma.subOrder.findMany({
      where: { orderId },
      include: { factory: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByFactoryId(factoryId: string): Promise<SubOrderWithFactory[]> {
    return this.prisma.subOrder.findMany({
      where: { factoryId },
      include: { factory: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Writes ───────────────────────────────────────────────────────────────────

  async updateStatus(id: string, status: SubOrderStatus): Promise<SubOrder> {
    return this.prisma.subOrder.update({
      where: { id },
      data:  { status },
    });
  }

  async updateProgress(id: string, progressPercent: number): Promise<SubOrder> {
    return this.prisma.subOrder.update({
      where: { id },
      data:  { progressPercent },
    });
  }

  async complete(id: string): Promise<SubOrder> {
    return this.prisma.subOrder.update({
      where: { id },
      data: {
        status:          SubOrderStatus.COMPLETED,
        progressPercent: 100,
        completedAt:     new Date(),
      },
    });
  }
}
