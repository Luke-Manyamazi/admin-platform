import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * Payload for POST /api/v1/suborders/:id/decline
 */
export class DeclineSubOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
