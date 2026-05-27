import { IsInt, Min, Max } from 'class-validator';

/**
 * Payload for PATCH /api/v1/suborders/:id/progress
 */
export class UpdateProgressDto {
  /** Progress percentage 0–100 */
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent!: number;
}
