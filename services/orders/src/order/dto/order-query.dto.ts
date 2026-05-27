import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@admin-platform/types';

/**
 * Query parameters for GET /api/v1/orders
 */
export class OrderQueryDto {
  @IsOptional()
  @IsEnum(Object.values(OrderStatus))
  status?: OrderStatus;

  /** Full-text search across productName and productCategory */
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
  @IsIn(['createdAt', 'deadline', 'totalValue', 'updatedAt'])
  sortBy?: 'createdAt' | 'deadline' | 'totalValue' | 'updatedAt' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
