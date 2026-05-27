import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Payload for POST /api/v1/orders/:id/dispute
 */
export class DisputeOrderDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  reason!: string;
}
