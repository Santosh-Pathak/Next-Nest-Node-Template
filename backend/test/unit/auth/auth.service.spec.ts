import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { OtpService } from '../../../src/modules/auth/services/otp.service';
import { Role } from '../../../src/common/enums/role.enum';
import { TokenType } from '../../../src/modules/auth/schemas/token.schema';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let tokenService: TokenService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: Role.DEVELOPER,
    isActive: true,
    isEmailVerified: false,
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password',
      role: Role.DEVELOPER,
      isActive: true,
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockTokenService = {
    generateAuthTokens: jest.fn(),
    refreshAuthTokens: jest.fn(),
    blacklistToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
    jwtService: {
      verify: jest.fn(),
    },
    configService: {
      get: jest.fn().mockReturnValue('test-secret'),
    },
  };

  const mockOtpService = {
    generateEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    tokenService = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('loginUserWithEmailAndPassword', () => {
    it('should login user successfully', async () => {
      const activeUser = { ...mockUser, isActive: true };
      mockUsersService.findByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersService.updateUser.mockResolvedValue(activeUser);

      const result = await service.loginUserWithEmailAndPassword('test@example.com', 'password123');

      expect(usersService.updateUser).toHaveBeenCalledWith(
        String(activeUser._id),
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.loginUserWithEmailAndPassword('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed-password',
          role: Role.DEVELOPER,
          isActive: false,
        }),
      };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.loginUserWithEmailAndPassword('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signup', () => {
    const signupData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should signup new user successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const newUser = { ...mockUser, ...signupData, password: 'hashed-password' };
      mockUsersService.createUser.mockResolvedValue(newUser);

      const result = await service.signup(signupData);

      expect(usersService.findByEmail).toHaveBeenCalledWith(signupData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
      expect(usersService.createUser).toHaveBeenCalledWith({
        ...signupData,
        password: 'hashed-password',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.signup(signupData)).rejects.toThrow(ConflictException);
    });
  });

  describe('registerUser', () => {
    const registerData = {
      name: 'Admin User',
      email: 'admin@example.com',
      role: Role.ADMIN,
    };

    it('should register user with system-generated password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-system-password');

      const newUser = { ...mockUser, ...registerData };
      mockUsersService.createUser.mockResolvedValue(newUser);

      const result = await service.registerUser(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('systemPassword');
      expect(result.user).not.toHaveProperty('password');
      expect(typeof result.systemPassword).toBe('string');
      expect(result.systemPassword.length).toBeGreaterThan(0);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.registerUser(registerData)).rejects.toThrow(ConflictException);
    });

    it('should set isEmailVerified to true by default', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-system-password');

      const newUser = { ...mockUser, ...registerData, isEmailVerified: true };
      mockUsersService.createUser.mockResolvedValue(newUser);

      await service.registerUser(registerData);

      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ isEmailVerified: true }),
      );
    });
  });

  describe('logout', () => {
    const refreshToken = 'valid-refresh-token';
    const mockPayload = {
      sub: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: Role.DEVELOPER,
      jti: 'token-id-123',
    };

    it('should logout user by blacklisting refresh token', async () => {
      mockTokenService.jwtService.verify.mockReturnValue(mockPayload);
      mockTokenService.blacklistToken.mockResolvedValue(undefined);

      await service.logout(refreshToken);

      expect(mockTokenService.jwtService.verify).toHaveBeenCalledWith(
        refreshToken,
        expect.any(Object),
      );
      expect(mockTokenService.blacklistToken).toHaveBeenCalledWith(
        mockPayload.jti,
        TokenType.REFRESH,
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockTokenService.jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.logout('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updatePassword', () => {
    const userId = '507f1f77bcf86cd799439011';
    const currentPassword = 'CurrentPassword123!';
    const newPassword = 'NewPassword123!';

    it('should update password successfully', async () => {
      mockUsersService.findUserById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockUsersService.updateUser.mockResolvedValue(mockUser);

      await service.updatePassword(userId, currentPassword, newPassword);

      expect(usersService.findUserById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(usersService.updateUser).toHaveBeenCalledWith(userId, {
        password: 'new-hashed-password',
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);

      await expect(service.updatePassword(userId, currentPassword, newPassword)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      mockUsersService.findUserById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.updatePassword(userId, 'WrongPassword', newPassword)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resetPassword', () => {
    const email = 'test@example.com';
    const newPassword = 'NewPassword123!';

    it('should reset password successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockUsersService.updateUser.mockResolvedValue(mockUser);
      mockTokenService.revokeAllUserTokens.mockResolvedValue(undefined);

      await service.resetPassword(email, newPassword);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(usersService.updateUser).toHaveBeenCalledWith(mockUser._id.toString(), {
        password: 'new-hashed-password',
      });
      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith(mockUser._id.toString());
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.resetPassword(email, newPassword)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshAuth', () => {
    const refreshToken = 'valid-refresh-token';
    const mockTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should refresh auth tokens successfully', async () => {
      mockTokenService.refreshAuthTokens.mockResolvedValue(mockTokens);

      const result = await service.refreshAuth(refreshToken);

      expect(tokenService.refreshAuthTokens).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(mockTokens);
    });
  });
});
