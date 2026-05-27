import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Payload for POST /api/v1/suborders/:id/complete
 */
export class CompleteSubOrderDto {
  /** Courier/logistics tracking reference — optional */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  trackingReference?: string;
}
