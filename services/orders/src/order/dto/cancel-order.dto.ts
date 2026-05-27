import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Payload for POST /api/v1/orders/:id/cancel
 */
export class CancelOrderDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}
