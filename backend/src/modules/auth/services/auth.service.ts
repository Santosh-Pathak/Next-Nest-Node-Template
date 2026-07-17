import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { TokenService, AuthTokens } from './token.service';
import { OtpService } from './otp.service';
import { EmailService } from '@shared/services/email.service';
import { UserDocument } from '../../users/schema/userSchema';
import { Role } from '@common/enums/role.enum';
import * as bcrypt from 'bcrypt';

/**
 * Application service for auth use-cases (SRP).
 * Controllers map HTTP only; orchestration lives here.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user.toObject();
    return result as UserDocument;
  }

  async loginUserWithEmailAndPassword(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.usersService.updateUser(String(user._id || user.id), { lastLogin: new Date() });

    return user;
  }

  /**
   * Signup — role is always developer (no client escalation).
   */
  async signup(signupData: { email: string; password: string; name: string }) {
    const existingUser = await this.usersService.findByEmail(signupData.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = await this.usersService.createUser({
      name: signupData.name,
      email: signupData.email,
      password: signupData.password,
      role: Role.DEVELOPER,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;
  }

  async signupWithTokens(signupData: { email: string; password: string; name: string }) {
    const user = await this.signup(signupData);
    const tokens = await this.tokenService.generateAuthTokens({
      id: String(user._id || user.id),
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async loginWithTokens(email: string, password: string) {
    const user = await this.loginUserWithEmailAndPassword(email, password);
    const tokens = await this.tokenService.generateAuthTokens({
      id: String(user._id || user.id),
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: String(user._id || user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        photo: user.photo || '',
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    return this.tokenService.refreshAuthTokens(refreshToken);
  }

  async registerUser(registerData: {
    name: string;
    email: string;
    role?: Role;
    description?: string;
    isEmailVerified?: boolean;
  }) {
    const existingUser = await this.usersService.findByEmail(registerData.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const systemPassword = this.generateRandomPassword();

    const user = await this.usersService.createUser({
      ...registerData,
      password: systemPassword,
      isEmailVerified: registerData.isEmailVerified ?? true,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();

    return {
      user: userWithoutPassword,
      systemPassword,
    };
  }

  async registerUserByAdmin(registerData: {
    name: string;
    email: string;
    role?: Role;
    description?: string;
    isEmailVerified?: boolean;
  }) {
    const { user, systemPassword } = await this.registerUser(registerData);

    try {
      await this.emailService.sendSystemPasswordEmail(user.name, user.email, systemPassword);
    } catch (error) {
      this.logger.error('Failed to send system password email', error);
    }

    return { user };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async refreshAuth(refreshToken: string) {
    return this.tokenService.refreshAuthTokens(refreshToken);
  }

  async sendVerificationEmail(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = await this.otpService.generateEmailOtp(email);

    try {
      await this.emailService.sendVerificationEmail(user.name, user.email, otp);
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  async verifyEmail(email: string, otp: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValidOtp = await this.otpService.verifyEmailOtp(email, otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.usersService.updateUser(user._id.toString(), {
      isEmailVerified: true,
    });
  }

  async forgetPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = await this.otpService.generateEmailOtp(email);

    try {
      await this.emailService.sendPasswordResetEmail(user.name, user.email, otp);
    } catch (error) {
      this.logger.error('Failed to send password reset email', error);
      throw new BadRequestException('Failed to send password reset email');
    }
  }

  /**
   * Verify OTP and issue a one-time reset token (OTP binding).
   */
  async verifyPasswordResetOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValidOtp = await this.otpService.verifyEmailOtp(email, otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const resetToken = await this.tokenService.issuePasswordResetToken(user._id.toString());
    return { resetToken };
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersService.setPassword(userId, newPassword);
  }

  /**
   * Reset password only with a valid reset token from verify-otp.
   */
  async resetPassword(email: string, newPassword: string, resetToken: string) {
    const userId = await this.tokenService.consumePasswordResetToken(resetToken);
    const user = await this.usersService.findByEmail(email);

    if (!user || user._id.toString() !== userId) {
      throw new BadRequestException('Invalid reset request');
    }

    await this.usersService.setPassword(userId, newPassword);
    await this.tokenService.revokeAllUserTokens(userId);

    try {
      await this.emailService.sendPasswordResetConfirmation(user.name, user.email);
    } catch (error) {
      this.logger.error('Failed to send password reset confirmation', error);
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async updateProfile(
    userId: string,
    updateData: { name?: string; email?: string; phone?: string; photo?: string },
  ) {
    const user = await this.usersService.updateUser(userId, updateData);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  private generateRandomPassword(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
