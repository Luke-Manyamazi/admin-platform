import { Injectable } from '@nestjs/common';
import { type Order, type OrderEvent, type Prisma } from '@admin-platform/database';
import { OrderStatus } from '@admin-platform/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { type CreateOrderDto } from './dto/create-order.dto';
import { type UpdateOrderDto } from './dto/update-order.dto';
import { type OrderQueryDto } from './dto/order-query.dto';

// ─── Result types ─────────────────────────────────────────────────────────────

export type OrderWithSubOrders = Prisma.OrderGetPayload<{
  include: { subOrders: true };
}>;

export interface PaginatedOrders {
  readonly items: OrderWithSubOrders[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface CreateSubOrderInput {
  readonly factoryId: string;
  readonly units: number;
  readonly deadline: Date;
  readonly trustScoreAtAllocation: number;
}

export interface AppendEventInput {
  readonly orderId: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly traceOrderId: string;
  readonly actorId?: string;
  readonly actorRole?: string;
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * OrderRepository — the ONLY place that calls Prisma for order and order-event data.
 *
 * Architecture rule: no Prisma calls in services or controllers.
 */
@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reads ────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<OrderWithSubOrders | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { subOrders: true },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.prisma.order.findUnique({ where: { orderNumber } });
  }

  async findMany(query: OrderQueryDto, buyerId?: string): Promise<PaginatedOrders> {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.OrderWhereInput = {
      // buyerId filter: if provided, scope to that buyer; otherwise show all (admin)
      ...(buyerId !== undefined ? { buyerId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(search !== undefined
        ? {
            OR: [
              { productName:     { contains: search, mode: 'insensitive' as const } },
              { productCategory: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { subOrders: true },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Count orders created in the given year — used for orderNumber generation.
   * Called inside the same transaction as create() to avoid race conditions.
   */
  async countByYear(year: number): Promise<number> {
    return this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt:  new Date(`${year + 1}-01-01T00:00:00.000Z`),
        },
      },
    });
  }

  // ── Writes ───────────────────────────────────────────────────────────────────

  async create(dto: CreateOrderDto, buyerId: string): Promise<OrderWithSubOrders> {
    const now = new Date();
    const year = now.getUTCFullYear();

    // Generate orderNumber inside a transaction to minimise gaps
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt:  new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      });

      const seq = String(count + 1).padStart(5, '0');
      const orderNumber = `ADMIN-${year}-${seq}`;

      const totalValue = dto.quantityUnits * dto.targetUnitPrice;

      return tx.order.create({
        data: {
          orderNumber,
          buyerId,
          status:          OrderStatus.DRAFT,
          productCategory: dto.productCategory,
          productName:     dto.productName,
          specifications:  dto.specifications as Prisma.InputJsonValue,
          quantityUnits:   dto.quantityUnits,
          unitOfMeasure:   dto.unitOfMeasure,
          targetUnitPrice: dto.targetUnitPrice,
          totalValue,
          currency:        'ZAR',
          deadline:        new Date(dto.deadline),
          deliveryAddress: dto.deliveryAddress,
          deliveryCountry: dto.deliveryCountry,
          notes:           dto.notes,
        },
        include: { subOrders: true },
      });
    });
  }

  async update(id: string, dto: UpdateOrderDto): Promise<OrderWithSubOrders> {
    const data: Prisma.OrderUpdateInput = {};

    if (dto.productCategory !== undefined) data.productCategory = dto.productCategory;
    if (dto.productName     !== undefined) data.productName     = dto.productName;
    if (dto.specifications  !== undefined) data.specifications  = dto.specifications as Prisma.InputJsonValue;
    if (dto.quantityUnits   !== undefined) data.quantityUnits   = dto.quantityUnits;
    if (dto.unitOfMeasure   !== undefined) data.unitOfMeasure   = dto.unitOfMeasure;
    if (dto.targetUnitPrice !== undefined) data.targetUnitPrice = dto.targetUnitPrice;
    if (dto.deadline        !== undefined) data.deadline        = new Date(dto.deadline);
    if (dto.deliveryAddress !== undefined) data.deliveryAddress = dto.deliveryAddress;
    if (dto.deliveryCountry !== undefined) data.deliveryCountry = dto.deliveryCountry;
    if (dto.notes           !== undefined) data.notes           = dto.notes;

    // Recalculate totalValue whenever quantity or price changes
    if (dto.quantityUnits !== undefined || dto.targetUnitPrice !== undefined) {
      // Fetch current values to recalculate
      const current = await this.prisma.order.findUniqueOrThrow({ where: { id } });
      const qty   = dto.quantityUnits   ?? current.quantityUnits;
      const price = dto.targetUnitPrice ?? current.targetUnitPrice;
      data.totalValue = qty * price;
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: { subOrders: true },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithSubOrders> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { subOrders: true },
    });
  }

  async createSubOrders(
    orderId: string,
    inputs: CreateSubOrderInput[],
  ): Promise<OrderWithSubOrders> {
    return this.prisma.$transaction(async (tx) => {
      await tx.subOrder.createMany({
        data: inputs.map((input) => ({
          orderId,
          factoryId:             input.factoryId,
          units:                 input.units,
          deadline:              input.deadline,
          trustScoreAtAllocation: input.trustScoreAtAllocation,
          status:                'PENDING_ACCEPTANCE',
          progressPercent:       0,
        })),
      });

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { subOrders: true },
      });
    });
  }

  async appendEvent(input: AppendEventInput): Promise<OrderEvent> {
    return this.prisma.orderEvent.create({
      data: {
        orderId:      input.orderId,
        type:         input.type,
        payload:      input.payload as Prisma.InputJsonValue,
        traceOrderId: input.traceOrderId,
        actorId:      input.actorId,
        actorRole:    input.actorRole,
      },
    });
  }
}
