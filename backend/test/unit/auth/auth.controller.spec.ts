import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { AuthCookieService } from '../../../src/modules/auth/services/auth-cookie.service';
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

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;

  const mockReq = {
    cookies: {},
  } as any;

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

  const mockAuthCookieService = {
    setAuthCookies: jest.fn(),
    clearAuthCookies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
      ],
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

    it('should signup a new user and set httpOnly cookies', async () => {
      mockAuthService.signupWithTokens.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const result = await controller.signup(signupDto, mockRes);

      expect(mockAuthService.signupWithTokens).toHaveBeenCalledWith(signupDto);
      expect(mockAuthCookieService.setAuthCookies).toHaveBeenCalledWith(mockRes, mockTokens);
      expect(result.message).toBe('User created successfully');
      expect(result.data).toEqual({ user: mockUser });
      expect((result.data as any).tokens).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should login and set httpOnly cookies without returning tokens', async () => {
      const loginUser = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        photo: '',
      };
      mockAuthService.loginWithTokens.mockResolvedValue({
        user: loginUser,
        tokens: mockTokens,
      });

      const result = await controller.login(
        {
          email: 'test@example.com',
          password: 'Password123!',
        },
        mockRes,
      );

      expect(mockAuthCookieService.setAuthCookies).toHaveBeenCalledWith(mockRes, mockTokens);
      expect(result.message).toBe('User logged in successfully');
      expect(result.data).toEqual({ user: loginUser });
      expect((result.data as any).tokens).toBeUndefined();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh from cookie and set new cookies', async () => {
      mockReq.cookies = { refreshToken: 'cookie-refresh' };
      mockAuthService.refreshTokens.mockResolvedValue(mockTokens);

      const result = await controller.refreshTokens(mockReq, mockRes, {});

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('cookie-refresh');
      expect(mockAuthCookieService.setAuthCookies).toHaveBeenCalledWith(mockRes, mockTokens);
      expect(result.data).toEqual({ refreshed: true });
    });
  });

  describe('logout', () => {
    it('should revoke cookie token and clear cookies', async () => {
      mockReq.cookies = { refreshToken: 'cookie-refresh' };
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(mockReq, mockRes, {});

      expect(mockAuthService.logout).toHaveBeenCalledWith('cookie-refresh');
      expect(mockAuthCookieService.clearAuthCookies).toHaveBeenCalledWith(mockRes);
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
