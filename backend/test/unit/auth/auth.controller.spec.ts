import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { Role } from '../../../src/common/enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.DEVELOPER,
    isActive: true,
    isEmailVerified: false,
    photo: '',
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockAuthService = {
    signupWithTokens: jest.fn(),
    loginWithTokens: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    registerUserByAdmin: jest.fn(),
    sendVerificationEmail: jest.fn(),
    verifyEmail: jest.fn(),
    forgetPassword: jest.fn(),
    verifyPasswordResetOtp: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'New User',
    };

    it('should signup a new user successfully', async () => {
      mockAuthService.signupWithTokens.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const result = await controller.signup(signupDto);

      expect(mockAuthService.signupWithTokens).toHaveBeenCalledWith(signupDto);
      expect(result.message).toBe('User created successfully');
      expect(result.data.tokens).toEqual(mockTokens);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockAuthService.loginWithTokens.mockResolvedValue({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          photo: '',
        },
        tokens: mockTokens,
      });

      const result = await controller.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.message).toBe('User logged in successfully');
      expect(result.data.tokens).toEqual(mockTokens);
    });
  });

  describe('verifyOTP', () => {
    it('should return resetToken', async () => {
      mockAuthService.verifyPasswordResetOtp.mockResolvedValue({ resetToken: 'tok' });

      const result = await controller.verifyOTP({ email: 'test@example.com', otp: '123456' });

      expect(result.data).toEqual({ resetToken: 'tok' });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with token', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword({
        email: 'test@example.com',
        password: 'NewPassword123!',
        resetToken: 'tok',
      });

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        'test@example.com',
        'NewPassword123!',
        'tok',
      );
      expect(result.message).toBe('Password reset successfully');
    });
  });

  describe('updatePassword', () => {
    it('should reject mismatched confirm password', async () => {
      await expect(
        controller.updatePassword(
          {
            currentPassword: 'Old123!',
            password: 'New123!',
            confirmPassword: 'Other123!',
          },
          mockUser.id,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
