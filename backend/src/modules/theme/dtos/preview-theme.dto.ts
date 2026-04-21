import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { ColorPaletteDto } from './color-palette.dto';
import { ThemeConfigDto } from './theme-config.dto';

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  BOTH = 'both',
}

export class PreviewThemeDto {
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

  @ApiPropertyOptional({
    enum: ThemeMode,
    example: ThemeMode.BOTH,
    description: 'Theme mode to preview',
    default: ThemeMode.BOTH,
  })
  @IsEnum(ThemeMode)
  @IsOptional()
  mode?: ThemeMode;
}
