import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { FactoryStatus } from '@admin-platform/types';

/**
 * Query parameters for GET /api/v1/factories
 */
export class FactoryQueryDto {
  @IsOptional()
  @IsEnum(Object.values(FactoryStatus))
  status?: FactoryStatus;

  /** ISO 3166-1 alpha-2 filter */
  @IsOptional()
  @IsString()
  country?: string;

  /** Full-text search across name and description */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['createdAt', 'trustScore', 'name'])
  sortBy?: 'createdAt' | 'trustScore' | 'name' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
