import { z } from 'zod';
import { createZodDto } from '@common/pipes/create-zod-dto';
import { ItemStatus } from '../schema/item.schema';

export const updateItemSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(ItemStatus).optional(),
});

export class UpdateItemDto extends createZodDto(updateItemSchema) {}
