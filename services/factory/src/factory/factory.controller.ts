import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@admin-platform/types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';
import { FactoryService } from './factory.service';
import { CreateFactoryDto } from './dto/create-factory.dto';
import { UpdateFactoryDto } from './dto/update-factory.dto';
import { FactoryQueryDto } from './dto/factory-query.dto';

/**
 * FactoryController — REST API for factory registry operations.
 *
 * Base path: /api/v1/factories  (prefix set in main.ts)
 * Auth: JwtAuthGuard (global) + RolesGuard (global)
 *
 * Public routes (no auth required):
 *   GET  /           — list VERIFIED factories (buyers browsing)
 *   GET  /:id        — get factory detail
 *
 * Authenticated routes:
 *   GET  /me         — list caller's own factories (FACTORY_OWNER)
 *   POST /           — register a new factory (FACTORY_OWNER)
 *   PATCH /:id       — update own factory (FACTORY_OWNER or ADMIN)
 *
 * Admin-only routes:
 *   POST /:id/verify  — approve factory (ADMIN)
 *   POST /:id/suspend — suspend factory (ADMIN)
 *   POST /:id/reject  — reject factory  (ADMIN)
 */
@Controller('factories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FactoryController {
  constructor(private readonly factoryService: FactoryService) {}

  // ── Public ──────────────────────────────────────────────────────────────────

  @Public()
  @Get()
  async listFactories(@Query() query: FactoryQueryDto) {
    const result = await this.factoryService.listFactories(query);
    return {
      success: true as const,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Public()
  @Get(':id')
  async getFactory(@Param('id') id: string) {
    return this.factoryService.getFactory(id);
  }

  // ── Authenticated ───────────────────────────────────────────────────────────

  @Get('me/list')
  @Roles(Role.FACTORY_OWNER)
  async getMyFactories(@CurrentUser() user: JwtPayload) {
    return this.factoryService.getMyFactories(user.sub);
  }

  @Post()
  @Roles(Role.FACTORY_OWNER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createFactory(
    @Body() dto: CreateFactoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.factoryService.createFactory(dto, user);
  }

  @Patch(':id')
  @Roles(Role.FACTORY_OWNER, Role.ADMIN)
  async updateFactory(
    @Param('id') id: string,
    @Body() dto: UpdateFactoryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.factoryService.updateFactory(id, dto, user);
  }

  // ── Admin-only ──────────────────────────────────────────────────────────────

  @Post(':id/verify')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async verifyFactory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.factoryService.verifyFactory(id, user);
  }

  @Post(':id/suspend')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async suspendFactory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.factoryService.suspendFactory(id, user);
  }

  @Post(':id/reject')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async rejectFactory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.factoryService.rejectFactory(id, user);
  }
}
