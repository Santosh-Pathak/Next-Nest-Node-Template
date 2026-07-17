import { z } from 'zod';
import { createZodDto } from '@common/pipes/create-zod-dto';

/** Public signup — role is never client-controlled (defaults to developer). */
export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export class SignupDto extends createZodDto(signupSchema) {}
