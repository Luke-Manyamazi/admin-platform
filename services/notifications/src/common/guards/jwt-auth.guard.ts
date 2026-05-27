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

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: Role;
  readonly iat: number;
  readonly exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractBearerToken(req);
    if (!token) throw new UnauthorizedException('Missing Bearer token');

    try {
      req.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }
  }

  private extractBearerToken(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
