import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { type JwtPayload } from '../guards/jwt-auth.guard';

/**
 * Extracts the authenticated user from the request (populated by JwtAuthGuard).
 *
 * @example
 *   @Get('me/factories')
 *   getMyFactories(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return request.user;
  },
);
