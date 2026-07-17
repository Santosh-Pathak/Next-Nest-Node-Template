import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Theme, ThemeDocument } from '../schema/theme.schema';
import { BaseService } from '@shared/services/base.service';
import { DocumentDao } from '@shared/services/document-dao.service';
import { CreateThemeDto, UpdateThemeDto, PreviewThemeDto, ThemeMode } from '../dtos';

@Injectable()
export class ThemeService extends BaseService<ThemeDocument> {
  constructor(
    @InjectModel(Theme.name) private themeModel: Model<ThemeDocument>,
    documentDao: DocumentDao,
  ) {
    super(themeModel, documentDao);
  }

  /**
   * Create a new theme with creator info
   */
  async createTheme(createThemeDto: CreateThemeDto, userId: string): Promise<ThemeDocument> {
    const themeData = {
      ...createThemeDto,
      createdBy: userId,
      updatedBy: userId,
    };

    return this.create(themeData);
  }

  /**
   * Update theme with updater info
   */
  async updateTheme(
    id: string,
    updateThemeDto: UpdateThemeDto,
    userId: string,
  ): Promise<ThemeDocument> {
    const themeData = {
      ...updateThemeDto,
      updatedBy: userId,
    };

    return this.update(id, themeData);
  }

  /**
   * Get theme by ID with population and usage tracking
   */
  async getThemeById(id: string): Promise<ThemeDocument> {
    const theme = await this.findById(id, [
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
    ]);

    // Update usage count and last used
    theme.metadata.usageCount += 1;
    theme.metadata.lastUsed = new Date();
    await theme.save();

    return theme;
  }

  /**
   * Get all themes with population
   */
  async getAllThemes(queryString: any) {
    return this.findAll(queryString, [
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
    ]);
  }

  /**
   * Get the currently active theme
   */
  async getActiveTheme(): Promise<ThemeDocument | null> {
    const activeTheme = await this.themeModel
      .findOne({ isActive: true })
      .populate('createdBy updatedBy', 'name email')
      .exec();

    return activeTheme;
  }

  /**
   * Get the default theme
   */
  async getDefaultTheme(): Promise<ThemeDocument | null> {
    const defaultTheme = await this.themeModel
      .findOne({ isDefault: true })
      .populate('createdBy updatedBy', 'name email')
      .exec();

    return defaultTheme;
  }

  /**
   * Get available themes (sorted by usage)
   */
  async getAvailableThemes(): Promise<ThemeDocument[]> {
    return this.themeModel
      .find({})
      .select('name description version isActive isDefault metadata.usageCount createdAt')
      .populate('createdBy', 'name email')
      .sort({ 'metadata.usageCount': -1, createdAt: -1 })
      .exec();
  }

  /**
   * Activate a theme
   */
  async activateTheme(id: string): Promise<ThemeDocument> {
    const theme = await this.findById(id);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Deactivate all other themes
    await this.themeModel.updateMany({}, { $set: { isActive: false } });

    // Activate this theme
    theme.isActive = true;
    theme.metadata.lastUsed = new Date();
    theme.metadata.usageCount += 1;
    await theme.save();

    await theme.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
    ]);

    return theme;
  }

  /**
   * Set theme as default
   */
  async setDefaultTheme(id: string): Promise<ThemeDocument> {
    const theme = await this.findById(id);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Remove default flag from other themes
    await this.themeModel.updateMany({ _id: { $ne: theme._id } }, { $set: { isDefault: false } });

    // Set this theme as default
    theme.isDefault = true;
    await theme.save();

    await theme.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
    ]);

    return theme;
  }

  /**
   * Delete theme with validation
   */
  async deleteTheme(id: string): Promise<void> {
    const theme = await this.findById(id);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Prevent deletion of active or default themes
    if (theme.isActive) {
      throw new BadRequestException(
        'Cannot delete active theme. Please activate another theme first.',
      );
    }

    if (theme.isDefault) {
      throw new BadRequestException(
        'Cannot delete default theme. Please set another theme as default first.',
      );
    }

    await this.delete(id);
  }

  /**
   * Clone a theme
   */
  async cloneTheme(id: string, userId: string): Promise<ThemeDocument> {
    const originalTheme = await this.findById(id);

    if (!originalTheme) {
      throw new NotFoundException('Theme not found');
    }

    const clonedThemeData = {
      name: `${originalTheme.name} (Copy)`,
      description: `Cloned from: ${originalTheme.description}`,
      version: '1.0.0',
      colorPalette: originalTheme.colorPalette,
      lightTheme: originalTheme.lightTheme,
      darkTheme: originalTheme.darkTheme,
      presets: originalTheme.presets,
      settings: originalTheme.settings,
      isActive: false,
      isDefault: false,
      createdBy: userId,
      updatedBy: userId,
    };

    const clonedTheme = await this.create(clonedThemeData);

    await clonedTheme.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
    ]);

    return clonedTheme;
  }

  /**
   * Export theme as JSON
   */
  async exportThemeAsJson(id: string): Promise<any> {
    const theme = await this.findById(id);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Update export count
    theme.metadata.exportCount += 1;
    await theme.save();

    return {
      name: theme.name,
      description: theme.description,
      version: theme.version,
      colorPalette: theme.colorPalette,
      lightTheme: theme.lightTheme,
      darkTheme: theme.darkTheme,
      presets: theme.presets,
      settings: theme.settings,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate CSS from theme
   */
  generateCSS(theme: ThemeDocument, mode: ThemeMode = ThemeMode.BOTH): string {
    const generateVars = (config: any, selector: string) => {
      return `${selector} {
    --bg-primary: ${config.background.primary};
    --bg-secondary: ${config.background.secondary};
    --bg-tertiary: ${config.background.tertiary};
    --fg-primary: ${config.foreground.primary};
    --fg-secondary: ${config.foreground.secondary};
    --fg-muted: ${config.foreground.muted};
    --border-default: ${config.border.default};
    --border-muted: ${config.border.muted};
    --border-strong: ${config.border.strong};
    --surface-default: ${config.surface.default};
    --surface-elevated: ${config.surface.elevated};
    --surface-overlay: ${config.surface.overlay};
    --interactive-primary: ${config.interactive.primary};
    --interactive-primary-hover: ${config.interactive.primaryHover};
    --interactive-primary-active: ${config.interactive.primaryActive};
    --interactive-secondary: ${config.interactive.secondary};
    --interactive-secondary-hover: ${config.interactive.secondaryHover};
    --interactive-secondary-active: ${config.interactive.secondaryActive};
}`;
    };

    let css = '';
    if (mode === ThemeMode.LIGHT || mode === ThemeMode.BOTH) {
      css += generateVars(theme.lightTheme, ':root');
    }
    if (mode === ThemeMode.DARK || mode === ThemeMode.BOTH) {
      css += '\n\n' + generateVars(theme.darkTheme, '.dark');
    }

    return css;
  }

  /**
   * Export theme as CSS
   */
  async exportThemeAsCSS(
    id: string,
    mode: ThemeMode = ThemeMode.BOTH,
  ): Promise<{ css: string; filename: string }> {
    const theme = await this.findById(id);

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    // Update export count
    theme.metadata.exportCount += 1;
    await theme.save();

    const css = this.generateCSS(theme, mode);

    return {
      css,
      filename: `${theme.name.replace(/\s+/g, '-').toLowerCase()}.css`,
    };
  }

  /**
   * Import theme from JSON
   */
  async importTheme(themeData: CreateThemeDto, userId: string): Promise<ThemeDocument> {
    const { name, description, version, colorPalette, lightTheme, darkTheme, presets, settings } =
      themeData;

    if (!name || !colorPalette || !lightTheme || !darkTheme) {
      throw new BadRequestException(
        'Invalid theme data. Required fields: name, colorPalette, lightTheme, darkTheme',
      );
    }

    // Check if theme with same name already exists
    const existingTheme = await this.themeModel.findOne({ name }).exec();
    if (existingTheme) {
      throw new BadRequestException(`Theme with name '${name}' already exists`);
    }

    const importedThemeData = {
      name,
      description: description || 'Imported theme',
      version: version || '1.0.0',
      colorPalette,
      lightTheme,
      darkTheme,
      presets: presets || [],
      settings: settings || {
        allowUserCustomization: true,
        enablePreview: true,
        autoGenerateShades: true,
      },
      isActive: false,
      isDefault: false,
      createdBy: userId,
      updatedBy: userId,
    };

    const importedTheme = await this.create(importedThemeData);

    await importedTheme.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
    ]);

    return importedTheme;
  }

  /**
   * Get theme statistics
   */
  async getThemeStats(): Promise<any> {
    const stats = await this.themeModel.aggregate([
      {
        $group: {
          _id: null,
          totalThemes: { $sum: 1 },
          activeThemes: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          defaultThemes: {
            $sum: { $cond: [{ $eq: ['$isDefault', true] }, 1, 0] },
          },
          totalUsage: { $sum: '$metadata.usageCount' },
          totalExports: { $sum: '$metadata.exportCount' },
          avgUsage: { $avg: '$metadata.usageCount' },
        },
      },
    ]);

    const mostUsedThemes = await this.themeModel
      .find()
      .sort({ 'metadata.usageCount': -1 })
      .limit(5)
      .select('name metadata.usageCount')
      .populate('createdBy', 'name');

    const recentThemes = await this.themeModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt')
      .populate('createdBy', 'name');

    return {
      stats: stats[0] || {
        totalThemes: 0,
        activeThemes: 0,
        defaultThemes: 0,
        totalUsage: 0,
        totalExports: 0,
        avgUsage: 0,
      },
      mostUsedThemes,
      recentThemes,
    };
  }

  /**
   * Validate theme data
   */
  validateThemeData(themeData: PreviewThemeDto): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!themeData.colorPalette) {
      errors.push('Color palette is required');
    }

    if (!themeData.lightTheme) {
      errors.push('Light theme configuration is required');
    }

    if (!themeData.darkTheme) {
      errors.push('Dark theme configuration is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Preview theme without saving
   */
  previewTheme(previewData: PreviewThemeDto): { css: string; preview: any } {
    const { colorPalette, lightTheme, darkTheme, mode = ThemeMode.BOTH } = previewData;

    if (!colorPalette || !lightTheme || !darkTheme) {
      throw new BadRequestException(
        'Color palette and theme configurations are required for preview',
      );
    }

    // Create a temporary theme object for CSS generation
    const tempTheme: any = {
      colorPalette,
      lightTheme,
      darkTheme,
    };

    const css = this.generateCSS(tempTheme, mode);

    return {
      css,
      preview: {
        colorPalette,
        lightTheme,
        darkTheme,
      },
    };
  }
}
