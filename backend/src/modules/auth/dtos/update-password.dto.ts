import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'currentPassword123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
