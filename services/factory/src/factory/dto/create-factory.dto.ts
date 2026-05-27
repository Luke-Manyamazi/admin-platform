import {
  IsString,
  IsEmail,
  IsUrl,
  IsArray,
  IsInt,
  IsPositive,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';

/**
 * Payload for POST /api/v1/factories
 *
 * All monetary values (minimumOrderValue) are in ZAR cents — integers only.
 * Never use floats for money.
 */
export class CreateFactoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  registrationNumber!: string;

  /** ISO 3166-1 alpha-2 country code (e.g. ZA, US, NG) */
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO country code (e.g. ZA)' })
  country!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  region!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(30)
  phone!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsArray()
  @IsString({ each: true })
  capabilities!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  /** Monthly production capacity in units */
  @IsInt()
  @IsPositive()
  capacityUnitsPerMonth!: number;

  /** Minimum order value in ZAR cents (integer — NEVER float) */
  @IsInt()
  @Min(0)
  minimumOrderValue!: number;
}
