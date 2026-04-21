import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;
}
