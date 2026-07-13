import { z } from 'zod';
import { createZodDto } from '@common/pipes/create-zod-dto';
import { Role } from '@common/enums/role.enum';

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role).optional(),
});

export class SignupDto extends createZodDto(signupSchema) {}
