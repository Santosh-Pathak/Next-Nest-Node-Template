import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'customer', enum: ['customer', 'admin', 'staff', 'superAdmin'] })
  @IsOptional()
  @IsEnum(['customer', 'admin', 'staff', 'superAdmin'])
  role?: string;

  @ApiPropertyOptional({ example: 'Software engineer with 5 years of experience' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;
}
