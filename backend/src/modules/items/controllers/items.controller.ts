import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ItemsService } from '../services/items.service';
import { CreateItemDto } from '../dtos/create-item.dto';
import { UpdateItemDto } from '../dtos/update-item.dto';
import { ApiPaginationQuery } from '@common/decorators/api-pagination.decorator';
import { AdminAndDeveloper, AdminAndSuperAdmin } from '@common/decorators/authorization.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('items')
@Controller('items')
@ApiBearerAuth()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @AdminAndDeveloper()
  @ApiOperation({
    summary: 'Create an item (example CRUD — copy this module for new features)',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Item created' })
  async create(@Body() createItemDto: CreateItemDto, @CurrentUser('userId') userId: string) {
    const item = await this.itemsService.createItem(createItemDto, userId);
    return {
      message: 'Item created successfully',
      data: item,
    };
  }

  @Get()
  @AdminAndDeveloper()
  @ApiOperation({ summary: 'List items with pagination/filtering' })
  @ApiPaginationQuery()
  @ApiResponse({ status: HttpStatus.OK, description: 'Items retrieved' })
  async findAll(@Query() query: Record<string, string>) {
    const result = await this.itemsService.findAllItems(query);
    return {
      message: 'Items retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @AdminAndDeveloper()
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found' })
  async findOne(@Param('id') id: string) {
    const item = await this.itemsService.findItemById(id);
    return {
      message: 'Item retrieved successfully',
      data: item,
    };
  }

  @Patch(':id')
  @AdminAndDeveloper()
  @ApiOperation({ summary: 'Update item by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item updated' })
  async update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    const item = await this.itemsService.updateItem(id, updateItemDto);
    return {
      message: 'Item updated successfully',
      data: item,
    };
  }

  @Delete(':id')
  @AdminAndSuperAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete item by ID (admin+)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Item deleted' })
  async remove(@Param('id') id: string) {
    await this.itemsService.deleteItem(id);
  }
}
