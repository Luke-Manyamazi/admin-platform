import { PartialType } from '@nestjs/mapped-types';
import { CreateFactoryDto } from './create-factory.dto';

/**
 * Payload for PATCH /api/v1/factories/:id
 *
 * All fields from CreateFactoryDto become optional.
 * registrationNumber cannot be changed after creation — enforced in the service.
 */
export class UpdateFactoryDto extends PartialType(CreateFactoryDto) {}
