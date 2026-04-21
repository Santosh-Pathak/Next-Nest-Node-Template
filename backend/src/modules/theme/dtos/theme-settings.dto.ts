import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ThemeSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Allow users to customize this theme',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  allowUserCustomization?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Enable theme preview', default: true })
  @IsBoolean()
  @IsOptional()
  enablePreview?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Auto-generate color shades', default: true })
  @IsBoolean()
  @IsOptional()
  autoGenerateShades?: boolean;
}
