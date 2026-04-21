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
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { ApiPaginationQuery } from '@common/decorators/api-pagination.decorator';
import { AdminOnly, AdminAndSuperAdmin } from '@common/decorators/authorization.decorator';
import { Permission } from '@common/enums/permission.enum';
import { RequirePermissions } from '@common/decorators/authorization.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @AdminOnly()
  @RequirePermissions(Permission.USER_CREATE)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return {
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @AdminAndSuperAdmin()
  @RequirePermissions(Permission.USER_LIST)
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiPaginationQuery()
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully' })
  async findAll(@Query() query: Record<string, string>) {
    const result = await this.usersService.findAllUsers(query);
    return {
      message: 'Users retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @AdminAndSuperAdmin()
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findUserById(id);
    return {
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Patch(':id')
  @AdminOnly()
  @RequirePermissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.updateUser(id, updateUserDto);
    return {
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @AdminOnly()
  @RequirePermissions(Permission.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async remove(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
  }
}
