import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { TokenService } from './token.service';
import { OtpService } from './otp.service';
import { UserDocument } from '../../users/schema/userSchema';
import { TokenType } from '../schemas/token.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
    private otpService: OtpService,
  ) {}

  /**
   * Validate user credentials
   */
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
    return result;
  }

  /**
   * Login user with email and password
   */
  async loginUserWithEmailAndPassword(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update last login
    await this.usersService.updateUser(String(user._id || user.id), { lastLogin: new Date() });

    return user;
  }

  /**
   * Signup new user
   */
  async signup(signupData: { email: string; password: string; name: string; role?: string }) {
    const existingUser = await this.usersService.findByEmail(signupData.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(signupData.password, 10);

    const user = await this.usersService.createUser({
      ...signupData,
      password: hashedPassword,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();

    return userWithoutPassword;
  }

  /**
   * Register user by admin (sends system-generated password)
   */
  async registerUser(registerData: {
    name: string;
    email: string;
    role?: string;
    description?: string;
    isEmailVerified?: boolean;
  }) {
    const existingUser = await this.usersService.findByEmail(registerData.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Generate random password
    const systemPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(systemPassword, 10);

    const user = await this.usersService.createUser({
      ...registerData,
      password: hashedPassword,
      isEmailVerified: registerData.isEmailVerified ?? true,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();

    return {
      user: userWithoutPassword,
      systemPassword, // Return to send via email
    };
  }

  /**
   * Logout user by blacklisting refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokenService['jwtService'].verify(refreshToken, {
        secret: this.tokenService['configService'].get<string>('jwt.refreshSecret'),
      });

      await this.tokenService.blacklistToken(payload.jti, TokenType.REFRESH);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshAuth(refreshToken: string) {
    return this.tokenService.refreshAuthTokens(refreshToken);
  }

  /**
   * Generate random password
   */
  private generateRandomPassword(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.usersService.updateUser(userId, { password: hashedPassword } as any);
  }

  /**
   * Reset password (after OTP verification)
   */
  async resetPassword(email: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.usersService.updateUser(user._id.toString(), { password: hashedPassword } as any);

    // Revoke all existing tokens
    await this.tokenService.revokeAllUserTokens(user._id.toString());
  }
}
