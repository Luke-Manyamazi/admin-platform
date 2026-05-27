import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { type Factory } from '@admin-platform/database';
import { FactoryStatus, Role } from '@admin-platform/types';
import {
  EVENT_SOURCE,
  DETAIL_TYPE,
  type FactoryVerifiedEvent,
} from '@admin-platform/events';
import { randomUUID } from 'crypto';
import { LoggerService } from '../common/logger/logger.service';
import { EventsService } from '../common/events/events.service';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import { FactoryRepository, type PaginatedFactories } from './factory.repository';
import { type CreateFactoryDto } from './dto/create-factory.dto';
import { type UpdateFactoryDto } from './dto/update-factory.dto';
import { type FactoryQueryDto } from './dto/factory-query.dto';

/**
 * FactoryService — business logic layer.
 *
 * Enforces:
 * - Ownership: FACTORY_OWNERs can only modify their own factories
 * - Status transitions: only valid transitions are allowed
 * - Event publishing: FactoryVerified → EventBridge on admin approval
 *
 * No Prisma calls here — all DB access goes via FactoryRepository.
 */
@Injectable()
export class FactoryService {
  private static readonly CONTEXT = 'FactoryService';

  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  // ── Reads ─────────────────────────────────────────────────────────────────

  async getFactory(id: string): Promise<Factory> {
    const factory = await this.factoryRepository.findById(id);
    if (!factory) throw new NotFoundException(`Factory ${id} not found`);
    return factory;
  }

  async getMyFactories(userId: string): Promise<Factory[]> {
    return this.factoryRepository.findByOwnerId(userId);
  }

  async listFactories(query: FactoryQueryDto): Promise<PaginatedFactories> {
    return this.factoryRepository.findMany(query);
  }

  // ── Writes ────────────────────────────────────────────────────────────────

  async createFactory(dto: CreateFactoryDto, actor: JwtPayload): Promise<Factory> {
    // Check for duplicate registration number
    const existing = await this.factoryRepository.findByRegistrationNumber(
      dto.registrationNumber,
    );
    if (existing) {
      throw new ConflictException(
        `Factory with registration number '${dto.registrationNumber}' already exists`,
      );
    }

    const factory = await this.factoryRepository.create(dto, actor.sub);

    this.logger.log(
      `Factory created: ${factory.id} (${factory.name}) by user ${actor.sub}`,
      FactoryService.CONTEXT,
    );

    return factory;
  }

  async updateFactory(
    id: string,
    dto: UpdateFactoryDto,
    actor: JwtPayload,
  ): Promise<Factory> {
    const factory = await this.getFactory(id);
    this.assertOwnerOrAdmin(factory, actor);

    const updated = await this.factoryRepository.update(id, dto);

    this.logger.log(
      `Factory updated: ${id} by user ${actor.sub}`,
      FactoryService.CONTEXT,
    );

    return updated;
  }

  async verifyFactory(id: string, actor: JwtPayload): Promise<Factory> {
    const factory = await this.getFactory(id);

    if (factory.status === FactoryStatus.VERIFIED) {
      throw new ConflictException(`Factory ${id} is already verified`);
    }

    const verified = await this.factoryRepository.updateStatus(
      id,
      FactoryStatus.VERIFIED,
    );

    // Generate a trace ID for this factory lifecycle flow
    const traceOrderId = randomUUID();

    const event: FactoryVerifiedEvent = {
      source: EVENT_SOURCE.FACTORY,
      detailType: DETAIL_TYPE.FACTORY_VERIFIED,
      detail: {
        factoryId: verified.id,
        factoryName: verified.name,
        ownerId: verified.ownerId,
        registrationNumber: verified.registrationNumber,
        country: verified.country,
        region: verified.region,
        traceOrderId,
      },
    };

    await this.eventsService.publish(event);

    this.logger.log(
      `Factory verified: ${id} by admin ${actor.sub} (trace: ${traceOrderId})`,
      FactoryService.CONTEXT,
    );

    return verified;
  }

  async suspendFactory(id: string, actor: JwtPayload): Promise<Factory> {
    const factory = await this.getFactory(id);

    if (factory.status === FactoryStatus.SUSPENDED) {
      throw new ConflictException(`Factory ${id} is already suspended`);
    }

    const suspended = await this.factoryRepository.updateStatus(
      id,
      FactoryStatus.SUSPENDED,
    );

    this.logger.log(
      `Factory suspended: ${id} by admin ${actor.sub}`,
      FactoryService.CONTEXT,
    );

    return suspended;
  }

  async rejectFactory(id: string, actor: JwtPayload): Promise<Factory> {
    const factory = await this.getFactory(id);

    if (factory.status === FactoryStatus.REJECTED) {
      throw new ConflictException(`Factory ${id} is already rejected`);
    }

    const rejected = await this.factoryRepository.updateStatus(
      id,
      FactoryStatus.REJECTED,
    );

    this.logger.log(
      `Factory rejected: ${id} by admin ${actor.sub}`,
      FactoryService.CONTEXT,
    );

    return rejected;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private assertOwnerOrAdmin(factory: Factory, actor: JwtPayload): void {
    if (actor.role === Role.ADMIN) return;
    if (factory.ownerId !== actor.sub) {
      throw new ForbiddenException('You do not own this factory');
    }
  }
}
