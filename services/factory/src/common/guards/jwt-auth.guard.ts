import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { type Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { type Role } from '@admin-platform/types';

// ─── JWT payload shape ────────────────────────────────────────────────────────

export interface JwtPayload {
  /** User ID (Prisma cuid) */
  readonly sub: string;
  readonly email: string;
  readonly role: Role;
  readonly iat: number;
  readonly exp: number;
}

// ─── Guard ────────────────────────────────────────────────────────────────────

/**
 * JwtAuthGuard — applied globally in AppModule.
 *
 * Verifies the Bearer token on every request. Routes decorated with @Public()
 * are exempt. On success, attaches the decoded payload to request.user so
 * the @CurrentUser() decorator can extract it.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractBearerToken(request);

    if (token === undefined) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token is invalid or has expired');
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const auth = request.headers.authorization;
    if (!auth) return undefined;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' && token !== undefined ? token : undefined;
  }
}
