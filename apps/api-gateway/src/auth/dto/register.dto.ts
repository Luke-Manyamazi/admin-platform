import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Role } from '@admin-platform/types';

/**
 * Payload for POST /api/v1/auth/register
 *
 * Self-registration is allowed for BUYER and FACTORY_OWNER roles.
 * ADMIN accounts must be seeded directly — they cannot self-register.
 */
export class RegisterDto {
  @IsEmail()
  email!: string;

  /**
   * Minimum 8 chars, at least one uppercase, one lowercase, one digit.
   */
  @IsString()
  @MinLength(8)
  @MaxLength(72)   // bcrypt truncates at 72 bytes
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, {
    message: 'password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /** ISO 3166-1 alpha-2 country code */
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO country code' })
  country?: string;

  /** BUYER (default) or FACTORY_OWNER. ADMIN cannot self-register. */
  @IsOptional()
  @IsEnum([Role.BUYER, Role.FACTORY_OWNER])
  role?: typeof Role.BUYER | typeof Role.FACTORY_OWNER;
}
