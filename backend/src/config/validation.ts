import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),

  MONGODB_URI: Joi.string().required(),
  MONGODB_URI_TEST: Joi.string().optional(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().default('noreply@example.com'),

  DEFAULT_PAGE_SIZE: Joi.number().default(100),
  MAX_PAGE_SIZE: Joi.number().default(1000),

  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_MAX: Joi.number().default(100),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'log', 'debug', 'verbose').default('debug'),
});
