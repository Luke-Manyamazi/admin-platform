import { SetMetadata } from '@nestjs/common';
import { type Role } from '@admin-platform/types';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
