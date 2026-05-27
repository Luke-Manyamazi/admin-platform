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

/**
 * RolesGuard — applied globally after JwtAuthGuard.
 *
 * Routes without @Roles() are accessible to any authenticated user.
 * Routes with @Roles() require the authenticated user to have one of the
 * specified roles. @Public() routes skip this guard via JwtAuthGuard's
 * unauthenticated bypass (request.user will be undefined).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — any authenticated user is allowed
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;

    if (user === undefined) {
      throw new ForbiddenException('Authentication required');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' | ')}`,
      );
    }

    return true;
  }
}
