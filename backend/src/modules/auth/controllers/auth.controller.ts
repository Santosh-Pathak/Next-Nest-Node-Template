import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dtos/signup.dto';
import { LoginDto } from '../dtos/login.dto';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { VerifyEmailDto } from '../dtos/verify-email.dto';
import { SendVerificationEmailDto } from '../dtos/send-verification-email.dto';
import { ForgetPasswordDto } from '../dtos/forget-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { UpdatePasswordDto } from '../dtos/update-password.dto';
import { LogoutDto } from '../dtos/logout.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public, AdminOnly } from '@common/decorators/authorization.decorator';

/**
 * Thin HTTP adapter (SRP): maps requests to AuthService use-cases only.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User signup' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already registered' })
  async signup(@Body() signupDto: SignupDto) {
    const { user, tokens } = await this.authService.signupWithTokens(signupDto);
    return {
      message: 'User created successfully',
      data: { user, tokens },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.loginWithTokens(loginDto.email, loginDto.password);
    return {
      message: 'User logged in successfully',
      data,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    return {
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Logout successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
  async logout(@Body() logoutDto: LogoutDto) {
    await this.authService.logout(logoutDto.refreshToken);
  }

  @Post('register-user')
  @AdminOnly()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register new user (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User registered successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Insufficient permissions',
  })
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    const { user } = await this.authService.registerUserByAdmin(registerUserDto);
    return {
      message: 'User created successfully',
      data: { user },
    };
  }

  @Public()
  @Post('send-verification-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send verification email' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verification email sent successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async sendVerificationEmail(@Body() dto: SendVerificationEmailDto) {
    await this.authService.sendVerificationEmail(dto.email);
    return { message: 'Verification email sent successfully' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid OTP' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.otp);
    return { message: 'Email verified successfully' };
  }

  @Public()
  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    await this.authService.forgetPassword(forgetPasswordDto.email);
    return { message: 'Password reset email sent successfully' };
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for password reset; returns one-time resetToken' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OTP verified successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid OTP' })
  async verifyOTP(@Body() verifyEmailDto: VerifyEmailDto) {
    const { resetToken } = await this.authService.verifyPasswordResetOtp(
      verifyEmailDto.email,
      verifyEmailDto.otp,
    );
    return {
      message: 'OTP verified successfully',
      data: { resetToken },
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password (requires resetToken from verify-otp)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.password,
      resetPasswordDto.resetToken,
    );
    return { message: 'Password reset successfully' };
  }

  @Patch('update-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update password (for logged in users)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password updated successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid current password' })
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @CurrentUser('userId') userId: string,
  ) {
    if (updatePasswordDto.password !== updatePasswordDto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    await this.authService.updatePassword(
      userId,
      updatePasswordDto.currentPassword,
      updatePasswordDto.password,
    );

    return { message: 'Password updated successfully' };
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile fetched successfully' })
  async getProfile(@CurrentUser('userId') userId: string) {
    const data = await this.authService.getProfile(userId);
    return {
      message: 'Profile fetched successfully',
      data,
    };
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully' })
  async updateProfile(@Body() updateData: UpdateProfileDto, @CurrentUser('userId') userId: string) {
    const data = await this.authService.updateProfile(userId, updateData);
    return {
      message: 'Profile updated successfully',
      data,
    };
  }
}
