import {
  IsString,
  IsInt,
  IsPositive,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Matches,
  IsObject,
} from 'class-validator';

/**
 * Payload for POST /api/v1/orders
 *
 * Creates an order in DRAFT status. The buyer must call
 * POST /api/v1/orders/:id/place to submit it for allocation.
 *
 * All monetary values are in ZAR cents — integers only. Never floats.
 */
export class CreateOrderDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  productCategory!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  productName!: string;

  /**
   * Flexible specification object — dimensions, materials, tolerances, etc.
   * Stored as JSON; structure varies by product category.
   *
   * Example: { material: 'steel', thickness: '3mm', finish: 'galvanised' }
   */
  @IsObject()
  specifications!: Record<string, unknown>;

  /** Number of units required */
  @IsInt()
  @IsPositive()
  quantityUnits!: number;

  /** Unit of measure — e.g. 'units', 'kg', 'metres' */
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  unitOfMeasure!: string;

  /**
   * Buyer's target price per unit in ZAR cents (integer — NEVER float).
   * e.g. 3500 = R 35.00
   */
  @IsInt()
  @Min(1)
  targetUnitPrice!: number;

  /**
   * ISO8601 deadline for the complete order.
   * Must be at least 3 days in the future (enforced in service).
   */
  @IsDateString()
  deadline!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  deliveryAddress!: string;

  /** ISO 3166-1 alpha-2 delivery country code (e.g. ZA, NG, KE) */
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/, { message: 'deliveryCountry must be a 2-letter ISO country code (e.g. ZA)' })
  deliveryCountry!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
