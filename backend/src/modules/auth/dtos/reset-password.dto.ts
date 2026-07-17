import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'One-time reset token returned from verify-otp',
  })
  @IsString()
  @MinLength(16)
  resetToken: string;
}
