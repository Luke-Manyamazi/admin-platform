import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

/**
 * Payload for PATCH /api/v1/orders/:id
 *
 * All fields from CreateOrderDto become optional.
 * Only DRAFT orders can be updated — enforced in OrderService.
 */
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
