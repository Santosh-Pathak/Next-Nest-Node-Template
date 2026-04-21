import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, Matches, ValidateNested, IsNotEmpty } from 'class-validator';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class ColorShadesDto {
  @ApiProperty({ example: '#f0f9ff', description: 'Color shade 50' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 50' })
  @IsNotEmpty()
  50: string;

  @ApiProperty({ example: '#e0f2fe', description: 'Color shade 100' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 100' })
  @IsNotEmpty()
  100: string;

  @ApiProperty({ example: '#bae6fd', description: 'Color shade 200' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 200' })
  @IsNotEmpty()
  200: string;

  @ApiProperty({ example: '#7dd3fc', description: 'Color shade 300' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 300' })
  @IsNotEmpty()
  300: string;

  @ApiProperty({ example: '#38bdf8', description: 'Color shade 400' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 400' })
  @IsNotEmpty()
  400: string;

  @ApiProperty({ example: '#0ea5e9', description: 'Color shade 500' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 500' })
  @IsNotEmpty()
  500: string;

  @ApiProperty({ example: '#0284c7', description: 'Color shade 600' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 600' })
  @IsNotEmpty()
  600: string;

  @ApiProperty({ example: '#0369a1', description: 'Color shade 700' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 700' })
  @IsNotEmpty()
  700: string;

  @ApiProperty({ example: '#075985', description: 'Color shade 800' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 800' })
  @IsNotEmpty()
  800: string;

  @ApiProperty({ example: '#0c4a6e', description: 'Color shade 900' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 900' })
  @IsNotEmpty()
  900: string;

  @ApiProperty({ example: '#082f49', description: 'Color shade 950' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 950' })
  @IsNotEmpty()
  950: string;
}

export class StateColorShadesDto {
  @ApiProperty({ example: '#f0fdf4', description: 'Color shade 50' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 50' })
  @IsNotEmpty()
  50: string;

  @ApiProperty({ example: '#22c55e', description: 'Color shade 500' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 500' })
  @IsNotEmpty()
  500: string;

  @ApiProperty({ example: '#16a34a', description: 'Color shade 600' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 600' })
  @IsNotEmpty()
  600: string;

  @ApiProperty({ example: '#15803d', description: 'Color shade 700' })
  @IsString()
  @Matches(HEX_COLOR_REGEX, { message: 'Invalid hex color format for shade 700' })
  @IsNotEmpty()
  700: string;
}

export class ColorPaletteDto {
  @ApiProperty({ type: ColorShadesDto })
  @ValidateNested()
  @Type(() => ColorShadesDto)
  @IsNotEmpty()
  primary: ColorShadesDto;

  @ApiProperty({ type: ColorShadesDto })
  @ValidateNested()
  @Type(() => ColorShadesDto)
  @IsNotEmpty()
  secondary: ColorShadesDto;

  @ApiProperty({ type: ColorShadesDto })
  @ValidateNested()
  @Type(() => ColorShadesDto)
  @IsNotEmpty()
  neutral: ColorShadesDto;

  @ApiProperty({ type: StateColorShadesDto })
  @ValidateNested()
  @Type(() => StateColorShadesDto)
  @IsNotEmpty()
  success: StateColorShadesDto;

  @ApiProperty({ type: StateColorShadesDto })
  @ValidateNested()
  @Type(() => StateColorShadesDto)
  @IsNotEmpty()
  warning: StateColorShadesDto;

  @ApiProperty({ type: StateColorShadesDto })
  @ValidateNested()
  @Type(() => StateColorShadesDto)
  @IsNotEmpty()
  error: StateColorShadesDto;

  @ApiProperty({ type: StateColorShadesDto })
  @ValidateNested()
  @Type(() => StateColorShadesDto)
  @IsNotEmpty()
  info: StateColorShadesDto;
}
