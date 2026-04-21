import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, Matches, ValidateNested, IsNotEmpty } from 'class-validator';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class BackgroundConfigDto {
  @ApiProperty({ example: '#ffffff', description: 'Primary background color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for primary background' })
  @IsNotEmpty()
  primary: string;

  @ApiProperty({ example: '#f8f9fa', description: 'Secondary background color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for secondary background' })
  @IsNotEmpty()
  secondary: string;

  @ApiProperty({ example: '#e9ecef', description: 'Tertiary background color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for tertiary background' })
  @IsNotEmpty()
  tertiary: string;
}

export class ForegroundConfigDto {
  @ApiProperty({ example: '#212529', description: 'Primary foreground color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for primary foreground' })
  @IsNotEmpty()
  primary: string;

  @ApiProperty({ example: '#495057', description: 'Secondary foreground color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for secondary foreground' })
  @IsNotEmpty()
  secondary: string;

  @ApiProperty({ example: '#6c757d', description: 'Muted foreground color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for muted foreground' })
  @IsNotEmpty()
  muted: string;
}

export class BorderConfigDto {
  @ApiProperty({ example: '#dee2e6', description: 'Default border color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for default border' })
  @IsNotEmpty()
  default: string;

  @ApiProperty({ example: '#e9ecef', description: 'Muted border color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for muted border' })
  @IsNotEmpty()
  muted: string;

  @ApiProperty({ example: '#adb5bd', description: 'Strong border color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for strong border' })
  @IsNotEmpty()
  strong: string;
}

export class SurfaceConfigDto {
  @ApiProperty({ example: '#ffffff', description: 'Default surface color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for default surface' })
  @IsNotEmpty()
  default: string;

  @ApiProperty({ example: '#f8f9fa', description: 'Elevated surface color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for elevated surface' })
  @IsNotEmpty()
  elevated: string;

  @ApiProperty({ example: 'rgba(0, 0, 0, 0.5)', description: 'Overlay color (can be rgba)' })
  @IsString()
  @IsNotEmpty()
  overlay: string;
}

export class InteractiveConfigDto {
  @ApiProperty({ example: '#0ea5e9', description: 'Primary interactive color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for primary interactive' })
  @IsNotEmpty()
  primary: string;

  @ApiProperty({ example: '#0284c7', description: 'Primary hover color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for primary hover' })
  @IsNotEmpty()
  primaryHover: string;

  @ApiProperty({ example: '#0369a1', description: 'Primary active color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for primary active' })
  @IsNotEmpty()
  primaryActive: string;

  @ApiProperty({ example: '#6c757d', description: 'Secondary interactive color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for secondary interactive' })
  @IsNotEmpty()
  secondary: string;

  @ApiProperty({ example: '#5a6268', description: 'Secondary hover color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for secondary hover' })
  @IsNotEmpty()
  secondaryHover: string;

  @ApiProperty({ example: '#545b62', description: 'Secondary active color' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for secondary active' })
  @IsNotEmpty()
  secondaryActive: string;
}

export class ThemeConfigDto {
  @ApiProperty({ type: BackgroundConfigDto })
  @ValidateNested()
  @Type(() => BackgroundConfigDto)
  @IsNotEmpty()
  background: BackgroundConfigDto;

  @ApiProperty({ type: ForegroundConfigDto })
  @ValidateNested()
  @Type(() => ForegroundConfigDto)
  @IsNotEmpty()
  foreground: ForegroundConfigDto;

  @ApiProperty({ type: BorderConfigDto })
  @ValidateNested()
  @Type(() => BorderConfigDto)
  @IsNotEmpty()
  border: BorderConfigDto;

  @ApiProperty({ type: SurfaceConfigDto })
  @ValidateNested()
  @Type(() => SurfaceConfigDto)
  @IsNotEmpty()
  surface: SurfaceConfigDto;

  @ApiProperty({ type: InteractiveConfigDto })
  @ValidateNested()
  @Type(() => InteractiveConfigDto)
  @IsNotEmpty()
  interactive: InteractiveConfigDto;
}
