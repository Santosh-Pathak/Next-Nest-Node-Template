import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ColorPaletteDto } from './color-palette.dto';
import { ThemeConfigDto } from './theme-config.dto';
import { ThemePresetDto } from './theme-preset.dto';
import { ThemeSettingsDto } from './theme-settings.dto';

export class CreateThemeDto {
  @ApiProperty({ example: 'Ocean Blue Theme', description: 'Theme name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'A beautiful ocean-inspired blue theme',
    description: 'Theme description',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ example: '1.0.0', description: 'Theme version', default: '1.0.0' })
  @IsString()
  @IsOptional()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in semantic versioning format (e.g., 1.0.0)',
  })
  version?: string;

  @ApiProperty({ type: ColorPaletteDto, description: 'Color palette configuration' })
  @ValidateNested()
  @Type(() => ColorPaletteDto)
  @IsNotEmpty()
  colorPalette: ColorPaletteDto;

  @ApiProperty({ type: ThemeConfigDto, description: 'Light theme configuration' })
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  @IsNotEmpty()
  lightTheme: ThemeConfigDto;

  @ApiProperty({ type: ThemeConfigDto, description: 'Dark theme configuration' })
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  @IsNotEmpty()
  darkTheme: ThemeConfigDto;

  @ApiPropertyOptional({ example: false, description: 'Set as active theme', default: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Set as default theme', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ type: [ThemePresetDto], description: 'Theme presets', default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThemePresetDto)
  @IsOptional()
  presets?: ThemePresetDto[];

  @ApiPropertyOptional({ type: ThemeSettingsDto, description: 'Theme settings' })
  @ValidateNested()
  @Type(() => ThemeSettingsDto)
  @IsOptional()
  settings?: ThemeSettingsDto;
}
