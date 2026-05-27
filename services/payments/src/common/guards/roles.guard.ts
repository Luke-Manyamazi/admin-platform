import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { type JwtPayload } from './jwt-auth.guard';
import { type Role } from '@admin-platform/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const user = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>().user;
    if (!user) throw new ForbiddenException('Authentication required');
    if (!required.includes(user.role))
      throw new ForbiddenException(`Required role: ${required.join(' | ')}`);
    return true;
  }
}
