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
import { TokenService } from '../services/token.service';
import { OtpService } from '../services/otp.service';
import { UsersService } from '../../users/services/users.service';
import { EmailService } from '@shared/services/email.service';
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
import { GetUser } from '../decorators/get-user.decorator';
import { Public, AdminOnly } from '@common/decorators/authorization.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User signup' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already registered' })
  async signup(@Body() signupDto: SignupDto) {
    const user = await this.authService.signup(signupDto);
    const tokens = await this.tokenService.generateAuthTokens({
      id: user._id || user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'User created successfully',
      data: {
        user,
        tokens,
      },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.loginUserWithEmailAndPassword(
      loginDto.email,
      loginDto.password,
    );

    const tokens = await this.tokenService.generateAuthTokens({
      id: String(user._id || user.id),
      email: user.email,
      role: user.role,
    });

    return {
      message: 'User logged in successfully',
      data: {
        user: {
          id: String(user._id || user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          photo: user.photo || '',
        },
        tokens,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.tokenService.refreshAuthTokens(refreshTokenDto.refreshToken);

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
    const { user, systemPassword } = await this.authService.registerUser(registerUserDto);

    // Send email with system-generated password
    try {
      await this.emailService.sendSystemPasswordEmail(user.name, user.email, systemPassword);
    } catch (error) {
      // Log error but don't fail the registration
      console.error('Failed to send email:', error);
    }

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
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = await this.otpService.generateEmailOtp(dto.email);

    try {
      await this.emailService.sendVerificationEmail(user.name, user.email, otp);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message: 'Verification email sent successfully',
    };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Email verified successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid OTP' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(verifyEmailDto.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValidOtp = await this.otpService.verifyEmailOtp(
      verifyEmailDto.email,
      verifyEmailDto.otp,
    );

    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update user as email verified
    await this.usersService.updateUser(user._id.toString(), {
      isEmailVerified: true,
    });

    return {
      message: 'Email verified successfully',
    };
  }

  @Public()
  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    const user = await this.usersService.findByEmail(forgetPasswordDto.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = await this.otpService.generateEmailOtp(forgetPasswordDto.email);

    try {
      await this.emailService.sendPasswordResetEmail(user.name, user.email, otp);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new BadRequestException('Failed to send password reset email');
    }

    return {
      message: 'Password reset email sent successfully',
    };
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for password reset' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OTP verified successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid OTP' })
  async verifyOTP(@Body() verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(verifyEmailDto.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isValidOtp = await this.otpService.verifyEmailOtp(
      verifyEmailDto.email,
      verifyEmailDto.otp,
    );

    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return {
      message: 'OTP verified successfully',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(resetPasswordDto.email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.password);

    try {
      await this.emailService.sendPasswordResetConfirmation(user.name, user.email);
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
    }

    return {
      message: 'Password reset successfully',
    };
  }

  @Patch('update-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update password (for logged in users)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password updated successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid current password' })
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetUser('userId') userId: string,
  ) {
    if (updatePasswordDto.password !== updatePasswordDto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    await this.authService.updatePassword(
      userId,
      updatePasswordDto.currentPassword,
      updatePasswordDto.password,
    );

    return {
      message: 'Password updated successfully',
    };
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile fetched successfully' })
  async getProfile(@GetUser('userId') userId: string) {
    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();

    return {
      message: 'Profile fetched successfully',
      data: userWithoutPassword,
    };
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile updated successfully' })
  async updateProfile(
    @Body() updateData: { name?: string; email?: string; phone?: string; photo?: string },
    @GetUser('userId') userId: string,
  ) {
    const user = await this.usersService.updateUser(userId, updateData);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject();

    return {
      message: 'Profile updated successfully',
      data: userWithoutPassword,
    };
  }
}
