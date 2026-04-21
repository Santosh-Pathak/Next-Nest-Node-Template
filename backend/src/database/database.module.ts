import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get('NODE_ENV') === 'test'
            ? configService.get('database.uriTest')
            : configService.get('database.uri'),
        connectionFactory: (connection: {
          on: (event: string, callback: (error?: Error) => void) => void;
        }) => {
          const logger = new Logger('DatabaseModule');
          connection.on('connected', () => {
            logger.log('✅ MongoDB connected successfully');
          });
          connection.on('error', (error?: Error) => {
            logger.error('❌ MongoDB connection error:', error?.stack || 'Unknown error');
          });
          connection.on('disconnected', () => {
            logger.warn('⚠️  MongoDB disconnected');
          });
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
