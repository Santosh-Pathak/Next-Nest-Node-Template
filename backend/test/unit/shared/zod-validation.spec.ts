import { createZodDto } from '@common/pipes/create-zod-dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { validateEnv, envSchema } from '@config/validation';
import { Role } from '@common/enums/role.enum';
import { z } from 'zod';

describe('Zod env validation', () => {
  it('accepts valid env', () => {
    const result = validateEnv({
      MONGODB_URI: 'mongodb://localhost:27017/app',
      JWT_SECRET: 'secret',
      JWT_REFRESH_SECRET: 'refresh',
    });

    expect(result.PORT).toBe(3000);
    expect(result.API_PREFIX).toBe('api');
    expect(result.LOG_LEVEL).toBe('info');
  });

  it('rejects missing required secrets', () => {
    expect(() =>
      validateEnv({
        MONGODB_URI: 'mongodb://localhost:27017/app',
      }),
    ).toThrow(/Environment validation failed/);
  });

  it('exports a parsable envSchema', () => {
    expect(envSchema.safeParse({}).success).toBe(false);
  });
});

describe('ZodValidationPipe + createZodDto', () => {
  const schema = z.object({
    email: z.string().email(),
    role: z.nativeEnum(Role).optional(),
  });

  class SampleDto extends createZodDto(schema) {}

  const pipe = new ZodValidationPipe();

  it('passes valid body', () => {
    const result = pipe.transform(
      { email: 'a@b.com', role: Role.DEVELOPER },
      { type: 'body', metatype: SampleDto, data: '' },
    );
    expect(result).toEqual({ email: 'a@b.com', role: Role.DEVELOPER });
  });

  it('throws BadRequest on invalid body', () => {
    expect(() =>
      pipe.transform(
        { email: 'not-an-email' },
        { type: 'body', metatype: SampleDto, data: '' },
      ),
    ).toThrow();
  });

  it('skips when metatype has no schema', () => {
    class PlainDto {}
    const value = { foo: 1 };
    expect(
      pipe.transform(value, { type: 'body', metatype: PlainDto, data: '' }),
    ).toBe(value);
  });
});
