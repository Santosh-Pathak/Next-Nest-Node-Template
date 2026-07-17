import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { OtpService } from '../../../src/modules/auth/services/otp.service';
import { EmailService } from '../../../src/shared/services/email.service';
import { Role } from '../../../src/common/enums/role.enum';
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
    photo: '',
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
    setPassword: jest.fn(),
  };

  const mockTokenService = {
    generateAuthTokens: jest.fn(),
    refreshAuthTokens: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
    issuePasswordResetToken: jest.fn(),
    consumePasswordResetToken: jest.fn(),
  };

  const mockOtpService = {
    generateEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
  };

  const mockEmailService = {
    sendSystemPasswordEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: EmailService, useValue: mockEmailService },
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
  });

  describe('signup', () => {
    const signupData = {
      email: 'new@example.com',
      password: 'Password123!',
      name: 'New User',
    };

    it('should signup new user as developer only', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const newUser = { ...mockUser, ...signupData };
      mockUsersService.createUser.mockResolvedValue(newUser);

      const result = await service.signup(signupData);

      expect(usersService.findByEmail).toHaveBeenCalledWith(signupData.email);
      expect(usersService.createUser).toHaveBeenCalledWith({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: Role.DEVELOPER,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      await expect(service.signup(signupData)).rejects.toThrow(ConflictException);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token via TokenService', async () => {
      mockTokenService.revokeRefreshToken.mockResolvedValue(undefined);

      await service.logout('valid-refresh-token');

      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockTokenService.revokeRefreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

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
      mockUsersService.setPassword.mockResolvedValue(mockUser);

      await service.updatePassword(userId, currentPassword, newPassword);

      expect(usersService.findUserById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
      expect(usersService.setPassword).toHaveBeenCalledWith(userId, newPassword);
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
    const resetToken = 'reset-token-abc';

    it('should reset password with valid reset token', async () => {
      mockTokenService.consumePasswordResetToken.mockResolvedValue(mockUser._id);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.setPassword.mockResolvedValue(mockUser);
      mockTokenService.revokeAllUserTokens.mockResolvedValue(undefined);
      mockEmailService.sendPasswordResetConfirmation.mockResolvedValue(undefined);

      await service.resetPassword(email, newPassword, resetToken);

      expect(tokenService.consumePasswordResetToken).toHaveBeenCalledWith(resetToken);
      expect(usersService.setPassword).toHaveBeenCalledWith(mockUser._id, newPassword);
      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith(mockUser._id);
    });

    it('should throw if email does not match token user', async () => {
      mockTokenService.consumePasswordResetToken.mockResolvedValue('other-user-id');
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.resetPassword(email, newPassword, resetToken)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyPasswordResetOtp', () => {
    it('should issue reset token after OTP verify', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.verifyEmailOtp.mockResolvedValue(true);
      mockTokenService.issuePasswordResetToken.mockResolvedValue('reset-xyz');

      const result = await service.verifyPasswordResetOtp(mockUser.email, '123456');

      expect(result).toEqual({ resetToken: 'reset-xyz' });
      expect(tokenService.issuePasswordResetToken).toHaveBeenCalledWith(mockUser._id);
    });
  });
});
