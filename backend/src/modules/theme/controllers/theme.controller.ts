import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ThemeService } from '../services/theme.service';
import { CreateThemeDto, UpdateThemeDto, PreviewThemeDto, ThemeMode } from '../dtos';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public, AdminAndSuperAdmin } from '@common/decorators/authorization.decorator';

@ApiTags('theme')
@Controller('theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  // ============ PUBLIC ROUTES ============

  @Public()
  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get currently active theme' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Active theme retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No active or default theme found' })
  async getActiveTheme() {
    const activeTheme = await this.themeService.getActiveTheme();

    if (!activeTheme) {
      // Return default theme if no active theme found
      const defaultTheme = await this.themeService.getDefaultTheme();
      if (!defaultTheme) {
        throw new BadRequestException('No active or default theme found');
      }
      return {
        message: 'Default theme retrieved successfully',
        data: defaultTheme,
      };
    }

    return {
      message: 'Active theme retrieved successfully',
      data: activeTheme,
    };
  }

  @Public()
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview theme without saving' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme preview generated successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid theme data' })
  async previewTheme(@Body() previewThemeDto: PreviewThemeDto) {
    const result = this.themeService.previewTheme(previewThemeDto);

    return {
      message: 'Theme preview generated successfully',
      data: result,
    };
  }

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate theme data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme validation completed' })
  async validateTheme(@Body() previewThemeDto: PreviewThemeDto) {
    const validation = this.themeService.validateThemeData(previewThemeDto);

    if (!validation.valid) {
      throw new BadRequestException(`Theme validation failed: ${validation.errors.join(', ')}`);
    }

    return {
      message: 'Theme validation passed',
      data: { valid: true },
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all themes with pagination and filtering' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Themes retrieved successfully' })
  async getAllThemes(@Query() query: any) {
    const result = await this.themeService.getAllThemes(query);

    return {
      message: 'Themes retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }
  // ============ AUTHENTICATED ROUTES ============

  // @ApiBearerAuth()

  @ApiBearerAuth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific theme by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  async getTheme(@Param('id') id: string) {
    const theme = await this.themeService.getThemeById(id);

    return {
      message: 'Theme retrieved successfully',
      data: theme,
    };
  }

  @ApiBearerAuth()
  @Get(':id/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export theme as JSON or CSS' })
  @ApiQuery({
    name: 'format',
    enum: ['json', 'css'],
    required: false,
    description: 'Export format',
  })
  @ApiQuery({
    name: 'mode',
    enum: ['light', 'dark', 'both'],
    required: false,
    description: 'CSS mode (only for CSS export)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme exported successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  async exportTheme(
    @Param('id') id: string,
    @Query('format') format = 'json',
    @Query('mode') mode: ThemeMode = ThemeMode.BOTH,
    @Res() res: Response,
  ) {
    if (format === 'css') {
      const { css, filename } = await this.themeService.exportThemeAsCSS(id, mode);
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(css);
    }

    // Default to JSON export
    const exportData = await this.themeService.exportThemeAsJson(id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportData.name.replace(/\s+/g, '-').toLowerCase()}.json"`,
    );
    return res.json(exportData);
  }

  // ============ SUPER ADMIN ONLY ROUTES ============

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new theme (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Theme created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid theme data' })
  async createTheme(@Body() createThemeDto: CreateThemeDto, @CurrentUser('_id') userId: string) {
    const theme = await this.themeService.createTheme(createThemeDto, userId);

    return {
      message: 'Theme created successfully',
      data: theme,
    };
  }

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update existing theme (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  async updateTheme(
    @Param('id') id: string,
    @Body() updateThemeDto: UpdateThemeDto,
    @CurrentUser('_id') userId: string,
  ) {
    const theme = await this.themeService.updateTheme(id, updateThemeDto, userId);

    return {
      message: 'Theme updated successfully',
      data: theme,
    };
  }

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete theme (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme deleted successfully' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete active or default theme',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  async deleteTheme(@Param('id') id: string) {
    await this.themeService.deleteTheme(id);

    return {
      message: 'Theme deleted successfully',
      data: null,
    };
  }

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Import theme from JSON (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Theme imported successfully' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid theme data or theme name already exists',
  })
  async importTheme(@Body() createThemeDto: CreateThemeDto, @CurrentUser('_id') userId: string) {
    const theme = await this.themeService.importTheme(createThemeDto, userId);

    return {
      message: 'Theme imported successfully',
      data: theme,
    };
  }

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate theme (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme activated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  async activateTheme(@Param('id') id: string) {
    const theme = await this.themeService.activateTheme(id);

    return {
      message: 'Theme activated successfully',
      data: theme,
    };
  }

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Patch(':id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set theme as default (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme set as default successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  async setDefaultTheme(@Param('id') id: string) {
    const theme = await this.themeService.setDefaultTheme(id);

    return {
      message: 'Theme set as default successfully',
      data: theme,
    };
  }

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Post(':id/clone')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Clone existing theme (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Theme cloned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Theme not found' })
  async cloneTheme(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    const theme = await this.themeService.cloneTheme(id, userId);

    return {
      message: 'Theme cloned successfully',
      data: theme,
    };
  }

  @ApiBearerAuth()
  @AdminAndSuperAdmin()
  @Get('admin/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get theme usage statistics (SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Theme statistics retrieved successfully' })
  async getThemeStats() {
    const stats = await this.themeService.getThemeStats();

    return {
      message: 'Theme statistics retrieved successfully',
      data: stats,
    };
  }
}
