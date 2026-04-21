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
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { Token, TokenSchema } from './schemas/token.schema';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<JwtModuleOptions> => {
        return {
          secret: configService.get<string>('jwt.secret') || 'fallback-secret',
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
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    OtpService,
    JwtStrategy,
    JwtRefreshStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, TokenService, OtpService],
})
export class AuthModule {}
