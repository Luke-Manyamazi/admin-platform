/**
 * @admin-platform/nest-common
 *
 * Shared NestJS infrastructure for all ADMIN microservices.
 * Import only what each service needs — no side-effects on import.
 */

// Logger
export { LoggerService } from './logger/logger.service';

// Prisma
export { PrismaService } from './prisma/prisma.service';

// Guards
export { JwtAuthGuard, type JwtPayload } from './guards/jwt-auth.guard';
export { RolesGuard } from './guards/roles.guard';

// Decorators
export { Public, IS_PUBLIC_KEY } from './decorators/public.decorator';
export { Roles, ROLES_KEY } from './decorators/roles.decorator';
export { CurrentUser } from './decorators/current-user.decorator';

// Filters
export { AllExceptionsFilter } from './filters/all-exceptions.filter';

// Interceptors
export { ResponseInterceptor } from './interceptors/response.interceptor';
