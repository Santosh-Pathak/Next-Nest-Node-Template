import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { AUTH_COOKIES } from '../constants/auth-cookies';
import type { AuthTokens } from './token.service';

@Injectable()
export class AuthCookieService {
  constructor(private readonly configService: ConfigService) {}

  setAuthCookies(res: Response, tokens: AuthTokens): void {
    res.cookie(AUTH_COOKIES.ACCESS_TOKEN, tokens.accessToken, this.accessCookieOptions());
    res.cookie(AUTH_COOKIES.REFRESH_TOKEN, tokens.refreshToken, this.refreshCookieOptions());
  }

  clearAuthCookies(res: Response): void {
    const base = this.baseCookieOptions();
    res.clearCookie(AUTH_COOKIES.ACCESS_TOKEN, base);
    res.clearCookie(AUTH_COOKIES.REFRESH_TOKEN, base);
  }

  private accessCookieOptions(): CookieOptions {
    return {
      ...this.baseCookieOptions(),
      maxAge: this.parseExpiryMs(this.configService.get<string>('jwt.expiresIn') || '1h'),
    };
  }

  private refreshCookieOptions(): CookieOptions {
    return {
      ...this.baseCookieOptions(),
      maxAge: this.parseExpiryMs(this.configService.get<string>('jwt.refreshExpiresIn') || '30d'),
    };
  }

  private baseCookieOptions(): CookieOptions {
    const isProduction = this.configService.get<string>('nodeEnv') === 'production';
    const sameSite = (this.configService.get<string>('security.cookieSameSite') ||
      (isProduction ? 'none' : 'lax')) as CookieOptions['sameSite'];
    const secure =
      this.configService.get<boolean>('security.cookieSecure') ??
      (isProduction || sameSite === 'none');

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
    };
  }

  private parseExpiryMs(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || multipliers.h);
  }
}
