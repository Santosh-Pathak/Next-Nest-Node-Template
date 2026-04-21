import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsArray,
  Matches,
} from 'class-validator';
import { ColorPaletteDto } from './color-palette.dto';
import { ThemeConfigDto } from './theme-config.dto';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class PreviewConfigDto {
  @ApiPropertyOptional({
    example: 'https://example.com/preview.png',
    description: 'Preview image URL',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    example: ['#0ea5e9', '#22c55e', '#ef4444'],
    description: 'Array of key preview colors',
  })
  @IsArray()
  @IsString({ each: true })
  @Matches(HEX_COLOR_REGEX, { each: true, message: 'Each preview color must be a valid hex color' })
  colors: string[];
}

export class ThemePresetDto {
  @ApiProperty({ example: 'Professional Blue', description: 'Preset name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A professional blue color scheme', description: 'Preset description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: ColorPaletteDto, description: 'Color palette for this preset' })
  @ValidateNested()
  @Type(() => ColorPaletteDto)
  @IsNotEmpty()
  colorPalette: ColorPaletteDto;

  @ApiProperty({ type: ThemeConfigDto, description: 'Light theme configuration for this preset' })
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  @IsNotEmpty()
  lightTheme: ThemeConfigDto;

  @ApiProperty({ type: ThemeConfigDto, description: 'Dark theme configuration for this preset' })
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  @IsNotEmpty()
  darkTheme: ThemeConfigDto;

  @ApiPropertyOptional({ type: PreviewConfigDto, description: 'Preview configuration' })
  @ValidateNested()
  @Type(() => PreviewConfigDto)
  @IsOptional()
  preview?: PreviewConfigDto;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this the default preset',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: ['professional', 'modern', 'blue'],
    description: 'Preset tags',
    default: [],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
