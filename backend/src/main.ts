import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  try {
    // eslint-disable-next-line no-console
    console.log('Starting bootstrap...');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // eslint-disable-next-line no-console
    console.log('App created successfully');

    const configService = app.get(ConfigService);

    // Security
    app.use(helmet());
    app.use(compression());

    // CORS
    app.enableCors({
      origin: configService.get('CORS_ORIGIN')?.split(',') || '*',
      credentials: true,
    });

    // Global prefix
    const apiPrefix = configService.get('API_PREFIX') || 'api';
    app.setGlobalPrefix(apiPrefix);

    // API Versioning
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Swagger documentation
    if (configService.get('NODE_ENV') !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Mail Service API')
        .setDescription('Production-level NestJS API with MongoDB')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('users')
        .addTag('auth')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
    }

    const port = configService.get('PORT') || 3000;
    // eslint-disable-next-line no-console
    console.log(`Attempting to listen on port ${port}...`);

    await app.listen(port);

    const logger = new Logger('Bootstrap');
    logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs`);
  } catch (error) {
    console.error('Error in bootstrap try block:', error);
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
