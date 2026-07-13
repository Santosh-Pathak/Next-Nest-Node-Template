import { z } from 'zod';

/**
 * Creates a Nest-friendly DTO class backed by a Zod schema.
 * ZodValidationPipe reads `schema` from the metatype.
 */
export function createZodDto<T extends z.ZodTypeAny>(schema: T) {
  class ZodDtoHost {
    static readonly schema = schema;
  }

  return ZodDtoHost as unknown as {
    new (): z.infer<T>;
    schema: T;
  };
}

export type ZodDtoClass = {
  schema: z.ZodTypeAny;
};
