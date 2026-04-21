import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { Token, TokenType } from '../../../src/modules/auth/schemas/token.schema';
import { Role } from '../../../src/common/enums/role.enum';
import { FactoryService } from '../../../src/shared/services/factory.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  const mockTokenModel = {
    create: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    findOne: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockFactoryService = {
    create: jest.fn(),
    createMany: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
        'jwt.expiresIn': '1h',
        'jwt.refreshExpiresIn': '7d',
      };
      return config[key];
    }),
  };

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: Role.DEVELOPER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: getModelToken(Token.name), useValue: mockTokenModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: FactoryService, useValue: mockFactoryService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAuthTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      mockFactoryService.createMany.mockResolvedValue([{}, {}]);

      const result = await service.generateAuthTokens(mockUser);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockFactoryService.createMany).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ type: TokenType.ACCESS }),
          expect.objectContaining({ type: TokenType.REFRESH }),
        ]),
      );
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should save tokens to database with correct expiration', async () => {
      mockJwtService.sign.mockReturnValue('token');
      mockFactoryService.createMany.mockResolvedValue([{}, {}]);

      await service.generateAuthTokens(mockUser);

      expect(mockFactoryService.createMany).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({
            expires: expect.any(Date),
            blacklisted: false,
          }),
        ]),
      );
    });
  });

  describe('generateAccessToken', () => {
    const refreshToken = 'valid-refresh-token';
    const mockPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      jti: 'refresh-token-id',
    };

    it('should generate new access token from valid refresh token', async () => {
      const mockAccessToken = 'new-access-token';

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockFactoryService.findOne.mockResolvedValue(null); // Not blacklisted
      mockJwtService.sign.mockReturnValue(mockAccessToken);
      mockFactoryService.create.mockResolvedValue({});

      const result = await service.generateAccessToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, expect.any(Object));
      expect(result).toBe(mockAccessToken);
      expect(mockFactoryService.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is blacklisted', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockFactoryService.findOne.mockResolvedValue({ blacklisted: true });

      await expect(service.generateAccessToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.generateAccessToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshAuthTokens', () => {
    const refreshToken = 'valid-refresh-token';
    const mockPayload = {
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      jti: 'refresh-token-id',
    };

    it('should refresh both tokens and blacklist old refresh token', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockFactoryService.findOne.mockResolvedValue(null); // Not blacklisted
      mockFactoryService.updateOne.mockResolvedValue({});
      mockJwtService.sign
        .mockReturnValueOnce(newTokens.accessToken)
        .mockReturnValueOnce(newTokens.refreshToken);
      mockFactoryService.createMany.mockResolvedValue([{}, {}]);

      const result = await service.refreshAuthTokens(refreshToken);

      expect(mockFactoryService.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        { token: mockPayload.jti, type: TokenType.REFRESH },
        { blacklisted: true },
      );
      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException if refresh token is blacklisted', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockFactoryService.findOne.mockResolvedValue({ blacklisted: true });

      await expect(service.refreshAuthTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('blacklistToken', () => {
    it('should blacklist a token', async () => {
      const tokenId = 'token-id-123';
      mockFactoryService.updateOne.mockResolvedValue({});

      await service.blacklistToken(tokenId, TokenType.REFRESH);

      expect(mockFactoryService.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        { token: tokenId, type: TokenType.REFRESH },
        { blacklisted: true },
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true if token is blacklisted', async () => {
      const tokenId = 'token-id-123';
      mockFactoryService.findOne.mockResolvedValue({ blacklisted: true });

      const result = await service.isTokenBlacklisted(tokenId, TokenType.ACCESS);

      expect(result).toBe(true);
      expect(mockFactoryService.findOne).toHaveBeenCalledWith(expect.anything(), {
        token: tokenId,
        type: TokenType.ACCESS,
        blacklisted: true,
      });
    });

    it('should return false if token is not blacklisted', async () => {
      const tokenId = 'token-id-123';
      mockFactoryService.findOne.mockResolvedValue(null);

      const result = await service.isTokenBlacklisted(tokenId, TokenType.ACCESS);

      expect(result).toBe(false);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      mockFactoryService.updateMany.mockResolvedValue({});

      await service.revokeAllUserTokens(userId);

      expect(mockFactoryService.updateMany).toHaveBeenCalledWith(
        expect.anything(),
        { user: expect.any(Object) },
        { blacklisted: true },
      );
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      mockFactoryService.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await service.deleteExpiredTokens();

      expect(mockFactoryService.deleteMany).toHaveBeenCalledWith(expect.anything(), {
        expires: { $lt: expect.any(Date) },
      });
    });
  });
});
