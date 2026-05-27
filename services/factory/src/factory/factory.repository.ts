import { Injectable } from '@nestjs/common';
import { type Factory, type Prisma } from '@admin-platform/database';
import { FactoryStatus } from '@admin-platform/types';
import { PrismaService } from '../common/prisma/prisma.service';
import { type CreateFactoryDto } from './dto/create-factory.dto';
import { type UpdateFactoryDto } from './dto/update-factory.dto';
import { type FactoryQueryDto } from './dto/factory-query.dto';

// ─── Paginated result ─────────────────────────────────────────────────────────

export interface PaginatedFactories {
  readonly items: Factory[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * FactoryRepository — the ONLY place that calls Prisma for factory data.
 *
 * Architecture rule: no Prisma calls in services or controllers.
 * All database access goes through this repository.
 */
@Injectable()
export class FactoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reads ────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Factory | null> {
    return this.prisma.factory.findUnique({ where: { id } });
  }

  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Factory | null> {
    return this.prisma.factory.findUnique({ where: { registrationNumber } });
  }

  async findByOwnerId(ownerId: string): Promise<Factory[]> {
    return this.prisma.factory.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMany(query: FactoryQueryDto): Promise<PaginatedFactories> {
    const {
      status,
      country,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.FactoryWhereInput = {
      ...(status !== undefined ? { status } : {}),
      ...(country !== undefined ? { country } : {}),
      ...(search !== undefined
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.factory.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.factory.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Writes ───────────────────────────────────────────────────────────────────

  async create(dto: CreateFactoryDto, ownerId: string): Promise<Factory> {
    return this.prisma.factory.create({
      data: {
        name: dto.name,
        registrationNumber: dto.registrationNumber,
        country: dto.country,
        region: dto.region,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        description: dto.description,
        capabilities: dto.capabilities,
        certifications: dto.certifications ?? [],
        capacityUnitsPerMonth: dto.capacityUnitsPerMonth,
        minimumOrderValue: dto.minimumOrderValue,
        status: FactoryStatus.PENDING,
        ownerId,
      },
    });
  }

  async update(id: string, dto: UpdateFactoryDto): Promise<Factory> {
    // registrationNumber is immutable after creation — strip it if present
    const { registrationNumber: _ignored, ...safeData } = dto;

    return this.prisma.factory.update({
      where: { id },
      data: safeData,
    });
  }

  async updateStatus(id: string, status: FactoryStatus): Promise<Factory> {
    return this.prisma.factory.update({
      where: { id },
      data: { status },
    });
  }
}
