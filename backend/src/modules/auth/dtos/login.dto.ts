import { z } from 'zod';
import { createZodDto } from '@common/pipes/create-zod-dto';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class LoginDto extends createZodDto(loginSchema) {}
