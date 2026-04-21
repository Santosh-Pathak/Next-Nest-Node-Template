import { Test, TestingModule } from '@nestjs/testing';
import { ThemeService } from '../../../src/modules/theme/services/theme.service';
import { getModelToken } from '@nestjs/mongoose';
import { Theme } from '../../../src/modules/theme/schema/theme.schema';
import { NotFoundException } from '@nestjs/common';
import { ThemeMode } from '../../../src/modules/theme/dtos';

describe('ThemeService', () => {
  let service: ThemeService;

  const mockTheme = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Ocean Blue',
    description: 'A professional ocean-inspired theme',
    version: '1.0.0',
    colorPalette: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
      neutral: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
      },
      success: { 50: '#ecfdf5', 500: '#10b981', 600: '#059669', 700: '#047857' },
      warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
      error: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
      info: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
    },
    lightTheme: {
      background: { primary: '#ffffff', secondary: '#f8fafc', tertiary: '#f1f5f9' },
      foreground: { primary: '#0f172a', secondary: '#334155', muted: '#64748b' },
      border: { default: '#e2e8f0', muted: '#f1f5f9', strong: '#cbd5e1' },
      surface: { default: '#ffffff', elevated: '#f8fafc', overlay: 'rgba(15, 23, 42, 0.8)' },
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        primaryActive: '#1d4ed8',
        secondary: '#64748b',
        secondaryHover: '#475569',
        secondaryActive: '#334155',
      },
    },
    darkTheme: {
      background: { primary: '#0f172a', secondary: '#1e293b', tertiary: '#334155' },
      foreground: { primary: '#f8fafc', secondary: '#e2e8f0', muted: '#94a3b8' },
      border: { default: '#334155', muted: '#1e293b', strong: '#475569' },
      surface: { default: '#1e293b', elevated: '#334155', overlay: 'rgba(0, 0, 0, 0.8)' },
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#60a5fa',
        primaryActive: '#93c5fd',
        secondary: '#94a3b8',
        secondaryHover: '#cbd5e1',
        secondaryActive: '#e2e8f0',
      },
    },
    isActive: true,
    isDefault: true,
    createdBy: '507f1f77bcf86cd799439012',
    updatedBy: '507f1f77bcf86cd799439012',
    metadata: {
      exportCount: 0,
      usageCount: 0,
      lastUsed: new Date(),
    },
    presets: [],
    settings: {
      allowUserCustomization: true,
      enablePreview: true,
      autoGenerateShades: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
    populate: jest.fn().mockReturnThis(),
  };

  const mockModel = {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeService,
        {
          provide: getModelToken(Theme.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ThemeService>(ThemeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTheme', () => {
    it('should create a new theme with user tracking', async () => {
      const createThemeDto: any = {
        name: 'Ocean Blue',
        description: 'A professional theme',
        version: '1.0.0',
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      // Mock the base service create method
      service.create = jest.fn().mockResolvedValue(mockTheme);

      const result = await service.createTheme(createThemeDto, '507f1f77bcf86cd799439012');

      expect(service.create).toHaveBeenCalledWith({
        ...createThemeDto,
        createdBy: '507f1f77bcf86cd799439012',
        updatedBy: '507f1f77bcf86cd799439012',
      });
      expect(result).toEqual(mockTheme);
    });
  });

  describe('getActiveTheme', () => {
    it('should return the active theme', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTheme),
      };
      mockModel.findOne = jest.fn().mockReturnValue(mockChain);

      const result = await service.getActiveTheme();

      expect(mockModel.findOne).toHaveBeenCalledWith({ isActive: true });
      expect(mockChain.populate).toHaveBeenCalledWith('createdBy updatedBy', 'name email');
      expect(result).toEqual(mockTheme);
    });

    it('should return null if no active theme exists', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      mockModel.findOne = jest.fn().mockReturnValue(mockChain);

      const result = await service.getActiveTheme();

      expect(result).toBeNull();
    });
  });

  describe('getDefaultTheme', () => {
    it('should return the default theme', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTheme),
      };
      mockModel.findOne = jest.fn().mockReturnValue(mockChain);

      const result = await service.getDefaultTheme();

      expect(mockModel.findOne).toHaveBeenCalledWith({ isDefault: true });
      expect(result).toEqual(mockTheme);
    });
  });

  describe('activateTheme', () => {
    it('should activate a theme and deactivate others', async () => {
      const mockThemeDoc = {
        ...mockTheme,
        save: jest.fn().mockResolvedValue(mockTheme),
        populate: jest.fn().mockResolvedValue(mockTheme),
      };

      // Mock the base service findById
      service.findById = jest.fn().mockResolvedValue(mockThemeDoc);
      mockModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });

      const result = await service.activateTheme('507f1f77bcf86cd799439011');

      expect(mockModel.updateMany).toHaveBeenCalledWith({}, { $set: { isActive: false } });
      expect(mockThemeDoc.isActive).toBe(true);
      expect(mockThemeDoc.save).toHaveBeenCalled();
      expect(result).toMatchObject({ _id: mockTheme._id, name: mockTheme.name, isActive: true });
    });

    it('should throw NotFoundException if theme not found', async () => {
      service.findById = jest.fn().mockRejectedValue(new NotFoundException('Theme not found'));

      await expect(service.activateTheme('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDefaultTheme', () => {
    it('should set theme as default and remove default from others', async () => {
      const mockThemeDoc = {
        ...mockTheme,
        save: jest.fn().mockResolvedValue(mockTheme),
        populate: jest.fn().mockResolvedValue(mockTheme),
      };

      service.findById = jest.fn().mockResolvedValue(mockThemeDoc);
      mockModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });

      const result = await service.setDefaultTheme('507f1f77bcf86cd799439011');

      expect(mockModel.updateMany).toHaveBeenCalledWith(
        { _id: { $ne: mockThemeDoc._id } },
        { $set: { isDefault: false } },
      );
      expect(mockThemeDoc.isDefault).toBe(true);
      expect(result).toMatchObject({ _id: mockTheme._id, name: mockTheme.name, isDefault: true });
    });
  });

  describe('deleteTheme', () => {
    it('should delete a theme if not active or default', async () => {
      const inactiveTheme = { ...mockTheme, isActive: false, isDefault: false };
      service.findById = jest.fn().mockResolvedValue(inactiveTheme);
      service.delete = jest.fn().mockResolvedValue(undefined);

      await service.deleteTheme('507f1f77bcf86cd799439011');

      expect(service.delete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw BadRequestException if theme is active', async () => {
      const activeTheme = { ...mockTheme, isActive: true, isDefault: false };
      service.findById = jest.fn().mockResolvedValue(activeTheme);

      await expect(service.deleteTheme('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Cannot delete active theme. Please activate another theme first.',
      );
    });

    it('should throw BadRequestException if theme is default', async () => {
      const defaultTheme = { ...mockTheme, isActive: false, isDefault: true };
      service.findById = jest.fn().mockResolvedValue(defaultTheme);

      await expect(service.deleteTheme('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Cannot delete default theme. Please set another theme as default first.',
      );
    });
  });

  describe('cloneTheme', () => {
    it('should clone an existing theme', async () => {
      const clonedTheme = { ...mockTheme, name: 'Ocean Blue (Copy)', _id: 'newid' };

      service.findById = jest.fn().mockResolvedValue(mockTheme);
      service.create = jest.fn().mockResolvedValue({
        ...clonedTheme,
        populate: jest.fn().mockResolvedValue(clonedTheme),
      });

      await service.cloneTheme('507f1f77bcf86cd799439011', 'userid123');

      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ocean Blue (Copy)',
          version: '1.0.0',
          isActive: false,
          isDefault: false,
          createdBy: 'userid123',
          updatedBy: 'userid123',
        }),
      );
    });
  });

  describe('exportThemeAsJson', () => {
    it('should export theme as JSON and update export count', async () => {
      const mockThemeDoc = {
        ...mockTheme,
        save: jest.fn().mockResolvedValue(mockTheme),
      };

      service.findById = jest.fn().mockResolvedValue(mockThemeDoc);

      const result = await service.exportThemeAsJson('507f1f77bcf86cd799439011');

      expect(mockThemeDoc.metadata.exportCount).toBe(1);
      expect(mockThemeDoc.save).toHaveBeenCalled();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('colorPalette');
      expect(result).toHaveProperty('exportedAt');
    });
  });

  describe('exportThemeAsCSS', () => {
    it('should export theme as CSS', async () => {
      const mockThemeDoc = {
        ...mockTheme,
        save: jest.fn().mockResolvedValue(mockTheme),
      };

      service.findById = jest.fn().mockResolvedValue(mockThemeDoc);

      const result = await service.exportThemeAsCSS('507f1f77bcf86cd799439011', ThemeMode.BOTH);

      expect(result).toHaveProperty('css');
      expect(result).toHaveProperty('filename');
      expect(result.css).toContain(':root');
      expect(result.css).toContain('.dark');
      expect(result.filename).toBe('ocean-blue.css');
    });

    it('should export only light mode CSS', async () => {
      const mockThemeDoc = {
        ...mockTheme,
        save: jest.fn().mockResolvedValue(mockTheme),
      };

      service.findById = jest.fn().mockResolvedValue(mockThemeDoc);

      const result = await service.exportThemeAsCSS('507f1f77bcf86cd799439011', ThemeMode.LIGHT);

      expect(result.css).toContain(':root');
      expect(result.css).not.toContain('.dark');
    });
  });

  describe('generateCSS', () => {
    it('should generate CSS variables for both modes', () => {
      const css = service.generateCSS(mockTheme as any, ThemeMode.BOTH);

      expect(css).toContain(':root');
      expect(css).toContain('.dark');
      expect(css).toContain('--bg-primary');
      expect(css).toContain('--fg-primary');
      expect(css).toContain('--interactive-primary');
    });

    it('should generate CSS for light mode only', () => {
      const css = service.generateCSS(mockTheme as any, ThemeMode.LIGHT);

      expect(css).toContain(':root');
      expect(css).not.toContain('.dark');
    });

    it('should generate CSS for dark mode only', () => {
      const css = service.generateCSS(mockTheme as any, ThemeMode.DARK);

      expect(css).toContain('.dark');
      expect(css).not.toContain(':root {');
    });
  });

  describe('importTheme', () => {
    it('should import a valid theme', async () => {
      const importData: any = {
        name: 'Imported Theme',
        description: 'An imported theme',
        version: '1.0.0',
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      const mockChain = { exec: jest.fn().mockResolvedValue(null) };
      mockModel.findOne = jest.fn().mockReturnValue(mockChain);
      service.create = jest.fn().mockResolvedValue({
        ...mockTheme,
        populate: jest.fn().mockResolvedValue(mockTheme),
      });

      await service.importTheme(importData, 'userid123');

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Imported Theme' });
      expect(service.create).toHaveBeenCalled();
    });

    it('should throw error if theme name already exists', async () => {
      const importData: any = {
        name: 'Ocean Blue',
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      const mockChain = { exec: jest.fn().mockResolvedValue(mockTheme) };
      mockModel.findOne = jest.fn().mockReturnValue(mockChain);

      await expect(service.importTheme(importData, 'userid123')).rejects.toThrow(
        "Theme with name 'Ocean Blue' already exists",
      );
    });

    it('should throw error if required fields are missing', async () => {
      const invalidData: any = { name: 'Test' };

      await expect(service.importTheme(invalidData, 'userid123')).rejects.toThrow(
        'Invalid theme data',
      );
    });
  });

  describe('getThemeStats', () => {
    it('should return theme statistics', async () => {
      const mockStats = [
        {
          _id: null,
          totalThemes: 5,
          activeThemes: 1,
          defaultThemes: 1,
          totalUsage: 100,
          totalExports: 20,
          avgUsage: 20,
        },
      ];

      const mockMostUsed = [{ name: 'Ocean Blue', metadata: { usageCount: 50 } }];
      const mockRecent = [{ name: 'New Theme', createdAt: new Date() }];

      mockModel.aggregate = jest.fn().mockResolvedValue(mockStats);

      const mockFindChain1 = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockMostUsed),
      };

      const mockFindChain2 = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockRecent),
      };

      mockModel.find = jest
        .fn()
        .mockReturnValueOnce(mockFindChain1)
        .mockReturnValueOnce(mockFindChain2);

      const result = await service.getThemeStats();

      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('mostUsedThemes');
      expect(result).toHaveProperty('recentThemes');
      expect(result.stats.totalThemes).toBe(5);
    });
  });

  describe('validateThemeData', () => {
    it('should validate valid theme data', () => {
      const validData: any = {
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      const result = service.validateThemeData(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid theme data', () => {
      const invalidData: any = { colorPalette: {} };

      const result = service.validateThemeData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('previewTheme', () => {
    it('should generate preview with CSS', () => {
      const previewData: any = {
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
        mode: ThemeMode.BOTH,
      };

      const result = service.previewTheme(previewData);

      expect(result).toHaveProperty('css');
      expect(result).toHaveProperty('preview');
      expect(result.css).toContain(':root');
      expect(result.css).toContain('.dark');
    });

    it('should throw error for invalid preview data', () => {
      const invalidData: any = {};

      expect(() => service.previewTheme(invalidData)).toThrow(
        'Color palette and theme configurations are required for preview',
      );
    });
  });
});
