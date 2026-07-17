import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { OtpService } from './services/otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Token, TokenSchema } from './schemas/token.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '@shared/email.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        return {
          secret: configService.getOrThrow<string>('jwt.secret'),
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expiresIn: (configService.get<string>('jwt.expiresIn') || '1h') as any,
          },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: Token.name, schema: TokenSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
    UsersModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, OtpService, JwtStrategy],
  exports: [AuthService, TokenService, OtpService],
})
export class AuthModule {}
