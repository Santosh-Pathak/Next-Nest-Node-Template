import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { TokenService } from '../../../src/modules/auth/services/token.service';
import { OtpService } from '../../../src/modules/auth/services/otp.service';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { EmailService } from '../../../src/shared/services/email.service';
import { Role } from '../../../src/common/enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let tokenService: TokenService;
  let otpService: OtpService;
  let usersService: UsersService;
  let emailService: EmailService;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.DEVELOPER,
    isActive: true,
    isEmailVerified: false,
    photo: '',
    toObject: jest.fn().mockReturnThis(),
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockAuthService = {
    signup: jest.fn(),
    loginUserWithEmailAndPassword: jest.fn(),
    logout: jest.fn(),
    registerUser: jest.fn(),
    updatePassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockTokenService = {
    generateAuthTokens: jest.fn(),
    refreshAuthTokens: jest.fn(),
  };

  const mockOtpService = {
    generateEmailOtp: jest.fn(),
    verifyEmailOtp: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockEmailService = {
    sendSystemPasswordEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendPasswordResetConfirmation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    otpService = module.get<OtpService>(OtpService);
    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
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
      const userWithoutPassword = { ...mockUser, email: signupDto.email, name: signupDto.name };
      mockAuthService.signup.mockResolvedValue(userWithoutPassword);
      mockTokenService.generateAuthTokens.mockResolvedValue(mockTokens);

      const result = await controller.signup(signupDto);

      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(tokenService.generateAuthTokens).toHaveBeenCalledWith({
        id: userWithoutPassword._id,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
      });
      expect(result).toEqual({
        message: 'User created successfully',
        data: {
          user: userWithoutPassword,
          tokens: mockTokens,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockAuthService.signup.mockRejectedValue(new BadRequestException('Email already registered'));

      await expect(controller.signup(signupDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user successfully', async () => {
      mockAuthService.loginUserWithEmailAndPassword.mockResolvedValue(mockUser);
      mockTokenService.generateAuthTokens.mockResolvedValue(mockTokens);

      const result = await controller.login(loginDto);

      expect(authService.loginUserWithEmailAndPassword).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(tokenService.generateAuthTokens).toHaveBeenCalledWith({
        id: String(mockUser._id),
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result.message).toBe('User logged in successfully');
      expect(result.data.user).toEqual({
        id: String(mockUser._id),
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        photo: mockUser.photo,
      });
      expect(result.data.tokens).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.loginUserWithEmailAndPassword.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh tokens successfully', async () => {
      mockTokenService.refreshAuthTokens.mockResolvedValue(mockTokens);

      const result = await controller.refreshTokens(refreshTokenDto);

      expect(tokenService.refreshAuthTokens).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(result).toEqual({
        message: 'Tokens refreshed successfully',
        data: mockTokens,
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockTokenService.refreshAuthTokens.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refreshTokens(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    const logoutDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(logoutDto);

      expect(authService.logout).toHaveBeenCalledWith(logoutDto.refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockAuthService.logout.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.logout(logoutDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registerUser', () => {
    const registerUserDto = {
      name: 'Admin User',
      email: 'admin@example.com',
      role: Role.ADMIN,
    };

    it('should register user successfully (Admin only)', async () => {
      const systemPassword = 'System@123';
      const registeredUser = { ...mockUser, ...registerUserDto };

      mockAuthService.registerUser.mockResolvedValue({
        user: registeredUser,
        systemPassword,
      });
      mockEmailService.sendSystemPasswordEmail.mockResolvedValue(undefined);

      const result = await controller.registerUser(registerUserDto);

      expect(authService.registerUser).toHaveBeenCalledWith(registerUserDto);
      expect(emailService.sendSystemPasswordEmail).toHaveBeenCalledWith(
        registeredUser.name,
        registeredUser.email,
        systemPassword,
      );
      expect(result).toEqual({
        message: 'User created successfully',
        data: { user: registeredUser },
      });
    });

    it('should not fail if email sending fails', async () => {
      const systemPassword = 'System@123';
      const registeredUser = { ...mockUser, ...registerUserDto };

      mockAuthService.registerUser.mockResolvedValue({
        user: registeredUser,
        systemPassword,
      });
      mockEmailService.sendSystemPasswordEmail.mockRejectedValue(new Error('Email failed'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await controller.registerUser(registerUserDto);

      expect(result).toEqual({
        message: 'User created successfully',
        data: { user: registeredUser },
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendVerificationEmail', () => {
    const dto = { email: 'test@example.com' };

    it('should send verification email successfully', async () => {
      const otp = '123456';
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.generateEmailOtp.mockResolvedValue(otp);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await controller.sendVerificationEmail(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(otpService.generateEmailOtp).toHaveBeenCalledWith(dto.email);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.name,
        mockUser.email,
        otp,
      );
      expect(result.message).toBe('Verification email sent successfully');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.sendVerificationEmail(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email sending fails', async () => {
      const otp = '123456';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.generateEmailOtp.mockResolvedValue(otp);
      mockEmailService.sendVerificationEmail.mockRejectedValue(new Error('Email failed'));

      await expect(controller.sendVerificationEmail(dto)).rejects.toThrow(BadRequestException);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto = {
      email: 'test@example.com',
      otp: '123456',
    };

    it('should verify email successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.verifyEmailOtp.mockResolvedValue(true);
      mockUsersService.updateUser.mockResolvedValue({ ...mockUser, isEmailVerified: true });

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(verifyEmailDto.email);
      expect(otpService.verifyEmailOtp).toHaveBeenCalledWith(
        verifyEmailDto.email,
        verifyEmailDto.otp,
      );
      expect(usersService.updateUser).toHaveBeenCalledWith(mockUser._id.toString(), {
        isEmailVerified: true,
      });
      expect(result.message).toBe('Email verified successfully');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if OTP is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.verifyEmailOtp.mockResolvedValue(false);

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgetPassword', () => {
    const dto = { email: 'test@example.com' };

    it('should send password reset email successfully', async () => {
      const otp = '123456';
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.generateEmailOtp.mockResolvedValue(otp);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await controller.forgetPassword(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(otpService.generateEmailOtp).toHaveBeenCalledWith(dto.email);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.name,
        mockUser.email,
        otp,
      );
      expect(result.message).toBe('Password reset email sent successfully');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.forgetPassword(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOTP', () => {
    const verifyOtpDto = {
      email: 'test@example.com',
      otp: '123456',
    };

    it('should verify OTP successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.verifyEmailOtp.mockResolvedValue(true);

      const result = await controller.verifyOTP(verifyOtpDto);

      expect(otpService.verifyEmailOtp).toHaveBeenCalledWith(verifyOtpDto.email, verifyOtpDto.otp);
      expect(result.message).toBe('OTP verified successfully');
    });

    it('should throw BadRequestException if OTP is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockOtpService.verifyEmailOtp.mockResolvedValue(false);

      await expect(controller.verifyOTP(verifyOtpDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      email: 'test@example.com',
      password: 'NewPassword123!',
    };

    it('should reset password successfully', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.resetPassword.mockResolvedValue(undefined);
      mockEmailService.sendPasswordResetConfirmation.mockResolvedValue(undefined);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(resetPasswordDto.email);
      expect(authService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.password,
      );
      expect(emailService.sendPasswordResetConfirmation).toHaveBeenCalledWith(
        mockUser.name,
        mockUser.email,
      );
      expect(result.message).toBe('Password reset successfully');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto = {
      currentPassword: 'OldPassword123!',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    };
    const userId = '507f1f77bcf86cd799439011';

    it('should update password successfully', async () => {
      mockAuthService.updatePassword.mockResolvedValue(undefined);

      const result = await controller.updatePassword(updatePasswordDto, userId);

      expect(authService.updatePassword).toHaveBeenCalledWith(
        userId,
        updatePasswordDto.currentPassword,
        updatePasswordDto.password,
      );
      expect(result.message).toBe('Password updated successfully');
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const mismatchedDto = { ...updatePasswordDto, confirmPassword: 'DifferentPassword!' };

      await expect(controller.updatePassword(mismatchedDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getProfile', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should return user profile successfully', async () => {
      const userWithPassword = { ...mockUser, password: 'hashed-password' };
      mockUsersService.findUserById.mockResolvedValue(userWithPassword);

      const result = await controller.getProfile(userId);

      expect(usersService.findUserById).toHaveBeenCalledWith(userId);
      expect(result.message).toBe('Profile fetched successfully');
      expect(result.data).not.toHaveProperty('password');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);

      await expect(controller.getProfile(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    const userId = '507f1f77bcf86cd799439011';
    const updateData = {
      name: 'Updated Name',
      phone: '+1234567890',
    };

    it('should update profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateData, password: 'hashed-password' };
      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(updateData, userId);

      expect(usersService.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.data).not.toHaveProperty('password');
    });
  });
});
