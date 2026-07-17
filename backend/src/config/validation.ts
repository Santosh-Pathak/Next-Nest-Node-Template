import { z } from 'zod';

/**
 * Zod-validated process env for Nest ConfigModule.
 * All env values arrive as strings — coerce numbers where needed.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('api'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_URI_TEST: z.string().optional(),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@example.com'),

  DEFAULT_PAGE_SIZE: z.coerce.number().default(100),
  MAX_PAGE_SIZE: z.coerce.number().default(1000),

  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),

  // Optional Azure — app boots without them; File/Email adapters warn if missing
  AZURE_STORAGE_ACCOUNT_NAME: z.string().optional(),
  AZURE_STORAGE_ACCOUNT_KEY: z.string().optional(),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_CONTAINER_NAME: z.string().default('uploads'),
  AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING: z.string().optional(),
  AZURE_SENDER_EMAIL: z.string().email().optional(),
  ADMIN_EMAIL: z.string().email().optional(),

  HEALTH_CHECK_DISK: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${details}`);
  }

  return parsed.data;
}
