export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',

  database: {
    uri: process.env.MONGODB_URI,
    uriTest: process.env.MONGODB_URI_TEST,
  },

  jwt: {
    // Secrets are required by validateEnv — no insecure fallbacks
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@example.com',
  },

  azure: {
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    storageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_CONTAINER_NAME || 'uploads',
    communicationConnectionString: process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING,
    senderEmail: process.env.AZURE_SENDER_EMAIL,
  },

  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '100', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '1000', 10),
  },

  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    // Use "none" + COOKIE_SECURE=true for cross-origin SPA; "lax" for same-origin proxy
    cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
    cookieSecure:
      process.env.COOKIE_SECURE === 'true' ||
      (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production'),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  health: {
    checkDisk: process.env.HEALTH_CHECK_DISK === 'true',
  },
});
