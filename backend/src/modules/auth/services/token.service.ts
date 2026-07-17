import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Token, TokenDocument, TokenType } from '../schemas/token.schema';
import { DocumentDao } from '@shared/services/document-dao.service';
import * as crypto from 'crypto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private documentDao: DocumentDao,
  ) {}

  /**
   * Generate a unique token ID
   */
  private generateTokenId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate authentication tokens (access and refresh)
   */
  async generateAuthTokens(user: { id: string; email: string; role: string }): Promise<AuthTokens> {
    const accessTokenId = this.generateTokenId();
    const refreshTokenId = this.generateTokenId();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenExpiry = this.configService.get<string>('jwt.expiresIn') || '1h';
    const refreshTokenExpiry = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    // Generate access token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = this.jwtService.sign({ ...payload, jti: accessTokenId }, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: accessTokenExpiry,
    } as any);

    // Generate refresh token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refreshToken = this.jwtService.sign({ ...payload, jti: refreshTokenId }, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: refreshTokenExpiry,
    } as any);

    // Calculate expiration dates
    const accessTokenExpiresAt = new Date(Date.now() + this.parseExpiry(accessTokenExpiry));
    const refreshTokenExpiresAt = new Date(Date.now() + this.parseExpiry(refreshTokenExpiry));

    // Save tokens to database
    await this.documentDao.createMany(this.tokenModel, [
      {
        token: accessTokenId,
        user: new Types.ObjectId(user.id),
        type: TokenType.ACCESS,
        expires: accessTokenExpiresAt,
        blacklisted: false,
      },
      {
        token: refreshTokenId,
        user: new Types.ObjectId(user.id),
        type: TokenType.REFRESH,
        expires: refreshTokenExpiresAt,
        blacklisted: false,
      },
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate a new access token from refresh token
   */
  async generateAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      }) as JwtPayload;

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(payload.jti!, TokenType.REFRESH);
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const accessTokenId = this.generateTokenId();
      const accessTokenExpiry = this.configService.get<string>('jwt.expiresIn') || '1h';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          jti: accessTokenId,
        },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: accessTokenExpiry,
        } as any,
      );

      // Save new access token
      const accessTokenExpiresAt = new Date(Date.now() + this.parseExpiry(accessTokenExpiry));
      await this.documentDao.create(this.tokenModel, {
        token: accessTokenId,
        user: new Types.ObjectId(payload.sub),
        type: TokenType.ACCESS,
        expires: accessTokenExpiresAt,
        blacklisted: false,
      });

      return accessToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Refresh both access and refresh tokens
   */
  async refreshAuthTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      }) as JwtPayload;

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(payload.jti!, TokenType.REFRESH);
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Blacklist old refresh token
      await this.blacklistToken(payload.jti!, TokenType.REFRESH);

      // Generate new tokens
      return this.generateAuthTokens({
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Revoke a refresh token JWT (verify + blacklist jti).
   * Encapsulation: callers must not reach into jwtService/configService.
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      }) as JwtPayload;

      if (!payload.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.blacklistToken(payload.jti, TokenType.REFRESH);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Issue a short-lived password-reset token after OTP verification.
   */
  async issuePasswordResetToken(userId: string): Promise<string> {
    const tokenId = this.generateTokenId();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.documentDao.create(this.tokenModel, {
      token: tokenId,
      user: new Types.ObjectId(userId),
      type: TokenType.RESET_PASSWORD,
      expires,
      blacklisted: false,
    });

    return tokenId;
  }

  /**
   * Consume a password-reset token. Returns user id if valid.
   */
  async consumePasswordResetToken(resetToken: string): Promise<string> {
    const doc = await this.documentDao.findOne(this.tokenModel, {
      token: resetToken,
      type: TokenType.RESET_PASSWORD,
      blacklisted: false,
      expires: { $gt: new Date() },
    });

    if (!doc) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    await this.blacklistToken(resetToken, TokenType.RESET_PASSWORD);
    return doc.user.toString();
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(tokenId: string, type: TokenType): Promise<void> {
    await this.documentDao.updateOne(
      this.tokenModel,
      { token: tokenId, type },
      { blacklisted: true },
    );
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(tokenId: string, type: TokenType): Promise<boolean> {
    const token = await this.documentDao.findOne(this.tokenModel, {
      token: tokenId,
      type,
      blacklisted: true,
    });

    return !!token;
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.documentDao.updateMany(
      this.tokenModel,
      { user: new Types.ObjectId(userId) },
      { blacklisted: true },
    );
  }

  /**
   * Delete expired tokens (cleanup job)
   */
  async deleteExpiredTokens(): Promise<void> {
    await this.documentDao.deleteMany(this.tokenModel, {
      expires: { $lt: new Date() },
    });
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000; // Default 1 hour
    }
  }
}
