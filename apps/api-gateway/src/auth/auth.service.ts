import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { Role } from '@admin-platform/types';
import { type RegisterDto } from './dto/register.dto';
import { type LoginDto } from './dto/login.dto';
import { type JwtPayload } from '../common/guards/jwt-auth.guard';

const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] ?? '12', 10);

export interface AuthResponse {
  readonly accessToken: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly role: string;
    readonly firstName: string;
    readonly lastName: string;
  };
}

/**
 * AuthService — JWT issuance and user lifecycle.
 *
 * The gateway is the ONLY service that issues JWTs and stores password hashes.
 * All other services verify tokens but never create them.
 */
@Injectable()
export class AuthService {
  private static readonly CTX = 'AuthService';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // ADMIN accounts cannot be created via the API
    if (dto.role === Role.ADMIN) {
      throw new ForbiddenException('ADMIN accounts cannot be self-registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email:        dto.email.toLowerCase(),
        passwordHash,
        firstName:    dto.firstName,
        lastName:     dto.lastName,
        phone:        dto.phone,
        country:      dto.country,
        role:         dto.role ?? Role.BUYER,
        isVerified:   false,
      },
    });

    this.logger.log(`User registered: ${user.id} (${user.email}, ${user.role})`, AuthService.CTX);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Use same error message for both "not found" and "wrong password" to avoid
      // leaking whether an account exists (timing-safe comparison still runs)
      await bcrypt.hash(dto.password, 12); // prevent timing oracle
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`User logged in: ${user.id} (${user.email})`, AuthService.CTX);

    return this.buildAuthResponse(user);
  }

  async getMe(payload: JwtPayload): Promise<{
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: Date;
  }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      select: {
        id:         true,
        email:      true,
        role:       true,
        firstName:  true,
        lastName:   true,
        isVerified: true,
        createdAt:  true,
      },
    });
    return user;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildAuthResponse(user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  }): AuthResponse {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub:   user.id,
      email: user.email,
      role:  user.role as Role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id:        user.id,
        email:     user.email,
        role:      user.role,
        firstName: user.firstName,
        lastName:  user.lastName,
      },
    };
  }
}
