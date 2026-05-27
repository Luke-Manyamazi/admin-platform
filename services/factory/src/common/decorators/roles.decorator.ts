import { SetMetadata } from '@nestjs/common';
import { type Role } from '@admin-platform/types';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to one or more roles. Used with RolesGuard.
 *
 * @example
 *   @Roles(Role.ADMIN)
 *   @Post(':id/verify')
 *   verifyFactory() { ... }
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
