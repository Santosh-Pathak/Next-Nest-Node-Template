import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemStatus } from '../schema/item.schema';

export class CreateItemDto {
  @ApiProperty({ example: 'Sample item' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Optional description for this item' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ItemStatus, example: ItemStatus.DRAFT })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}
