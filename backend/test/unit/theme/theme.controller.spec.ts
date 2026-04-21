import { Test, TestingModule } from '@nestjs/testing';
import { ThemeController } from '../../../src/modules/theme/controllers/theme.controller';
import { ThemeService } from '../../../src/modules/theme/services/theme.service';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ThemeMode } from '../../../src/modules/theme/dtos';

describe('ThemeController', () => {
  let controller: ThemeController;
  let service: ThemeService;

  const mockTheme = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Ocean Blue',
    description: 'A professional ocean-inspired theme',
    version: '1.0.0',
    colorPalette: {
      primary: { 50: '#eff6ff', 500: '#3b82f6', 950: '#172554' },
      secondary: { 50: '#f8fafc', 500: '#64748b', 950: '#020617' },
      neutral: { 50: '#fafafa', 500: '#71717a', 950: '#09090b' },
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
    metadata: { exportCount: 0, usageCount: 5, lastUsed: new Date() },
    presets: [],
    settings: { allowUserCustomization: true, enablePreview: true, autoGenerateShades: true },
  };

  const mockThemeService = {
    getActiveTheme: jest.fn(),
    getDefaultTheme: jest.fn(),
    getAllThemes: jest.fn(),
    getThemeById: jest.fn(),
    createTheme: jest.fn(),
    updateTheme: jest.fn(),
    deleteTheme: jest.fn(),
    activateTheme: jest.fn(),
    setDefaultTheme: jest.fn(),
    cloneTheme: jest.fn(),
    exportThemeAsJson: jest.fn(),
    exportThemeAsCSS: jest.fn(),
    importTheme: jest.fn(),
    getThemeStats: jest.fn(),
    validateThemeData: jest.fn(),
    previewTheme: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThemeController],
      providers: [
        {
          provide: ThemeService,
          useValue: mockThemeService,
        },
      ],
    }).compile();

    controller = module.get<ThemeController>(ThemeController);
    service = module.get<ThemeService>(ThemeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getActiveTheme', () => {
    it('should return active theme', async () => {
      mockThemeService.getActiveTheme.mockResolvedValue(mockTheme);

      const result = await controller.getActiveTheme();

      expect(service.getActiveTheme).toHaveBeenCalled();
      expect(result.message).toBe('Active theme retrieved successfully');
      expect(result.data).toEqual(mockTheme);
    });

    it('should return default theme if no active theme', async () => {
      mockThemeService.getActiveTheme.mockResolvedValue(null);
      mockThemeService.getDefaultTheme.mockResolvedValue(mockTheme);

      const result = await controller.getActiveTheme();

      expect(service.getActiveTheme).toHaveBeenCalled();
      expect(service.getDefaultTheme).toHaveBeenCalled();
      expect(result.message).toBe('Default theme retrieved successfully');
      expect(result.data).toEqual(mockTheme);
    });

    it('should throw error if no active or default theme', async () => {
      mockThemeService.getActiveTheme.mockResolvedValue(null);
      mockThemeService.getDefaultTheme.mockResolvedValue(null);

      await expect(controller.getActiveTheme()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllThemes', () => {
    it('should return paginated themes', async () => {
      const mockResult = {
        data: [mockTheme],
        meta: {
          results: 1,
          limit: 10,
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
        },
      };

      mockThemeService.getAllThemes.mockResolvedValue(mockResult);

      const result = await controller.getAllThemes({ page: 1, limit: 10 });

      expect(service.getAllThemes).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(result.message).toBe('Themes retrieved successfully');
      expect(result.data).toEqual(mockResult.data);
      expect(result.meta).toEqual(mockResult.meta);
    });
  });

  describe('getTheme', () => {
    it('should return a specific theme by id', async () => {
      mockThemeService.getThemeById.mockResolvedValue(mockTheme);

      const result = await controller.getTheme('507f1f77bcf86cd799439011');

      expect(service.getThemeById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result.message).toBe('Theme retrieved successfully');
      expect(result.data).toEqual(mockTheme);
    });
  });

  describe('createTheme', () => {
    it('should create a new theme', async () => {
      const createDto: any = {
        name: 'New Theme',
        description: 'A new theme',
        version: '1.0.0',
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      mockThemeService.createTheme.mockResolvedValue(mockTheme);

      const result = await controller.createTheme(createDto, 'userid123');

      expect(service.createTheme).toHaveBeenCalledWith(createDto, 'userid123');
      expect(result.message).toBe('Theme created successfully');
      expect(result.data).toEqual(mockTheme);
    });
  });

  describe('updateTheme', () => {
    it('should update an existing theme', async () => {
      const updateDto: any = { name: 'Updated Theme' };
      mockThemeService.updateTheme.mockResolvedValue(mockTheme);

      const result = await controller.updateTheme(
        '507f1f77bcf86cd799439011',
        updateDto,
        'userid123',
      );

      expect(service.updateTheme).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateDto,
        'userid123',
      );
      expect(result.message).toBe('Theme updated successfully');
      expect(result.data).toEqual(mockTheme);
    });
  });

  describe('deleteTheme', () => {
    it('should delete a theme', async () => {
      mockThemeService.deleteTheme.mockResolvedValue(undefined);

      const result = await controller.deleteTheme('507f1f77bcf86cd799439011');

      expect(service.deleteTheme).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result.message).toBe('Theme deleted successfully');
      expect(result.data).toBeNull();
    });
  });

  describe('activateTheme', () => {
    it('should activate a theme', async () => {
      mockThemeService.activateTheme.mockResolvedValue(mockTheme);

      const result = await controller.activateTheme('507f1f77bcf86cd799439011');

      expect(service.activateTheme).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result.message).toBe('Theme activated successfully');
      expect(result.data).toEqual(mockTheme);
    });
  });

  describe('setDefaultTheme', () => {
    it('should set theme as default', async () => {
      mockThemeService.setDefaultTheme.mockResolvedValue(mockTheme);

      const result = await controller.setDefaultTheme('507f1f77bcf86cd799439011');

      expect(service.setDefaultTheme).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result.message).toBe('Theme set as default successfully');
      expect(result.data).toEqual(mockTheme);
    });
  });

  describe('cloneTheme', () => {
    it('should clone an existing theme', async () => {
      const clonedTheme = { ...mockTheme, name: 'Ocean Blue (Copy)' };
      mockThemeService.cloneTheme.mockResolvedValue(clonedTheme);

      const result = await controller.cloneTheme('507f1f77bcf86cd799439011', 'userid123');

      expect(service.cloneTheme).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'userid123');
      expect(result.message).toBe('Theme cloned successfully');
      expect(result.data).toEqual(clonedTheme);
    });
  });

  describe('exportTheme', () => {
    it('should export theme as JSON', async () => {
      const exportData = { ...mockTheme, exportedAt: new Date().toISOString() };
      mockThemeService.exportThemeAsJson.mockResolvedValue(exportData);

      const mockResponse = {
        setHeader: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.exportTheme(
        '507f1f77bcf86cd799439011',
        'json',
        ThemeMode.BOTH,
        mockResponse,
      );

      expect(service.exportThemeAsJson).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.json).toHaveBeenCalledWith(exportData);
    });

    it('should export theme as CSS', async () => {
      const cssData = { css: ':root { --bg-primary: #ffffff; }', filename: 'ocean-blue.css' };
      mockThemeService.exportThemeAsCSS.mockResolvedValue(cssData);

      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.exportTheme('507f1f77bcf86cd799439011', 'css', ThemeMode.BOTH, mockResponse);

      expect(service.exportThemeAsCSS).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        ThemeMode.BOTH,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/css');
      expect(mockResponse.send).toHaveBeenCalledWith(cssData.css);
    });
  });

  describe('importTheme', () => {
    it('should import a theme from JSON', async () => {
      const importDto: any = {
        name: 'Imported Theme',
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      mockThemeService.importTheme.mockResolvedValue(mockTheme);

      const result = await controller.importTheme(importDto, 'userid123');

      expect(service.importTheme).toHaveBeenCalledWith(importDto, 'userid123');
      expect(result.message).toBe('Theme imported successfully');
      expect(result.data).toEqual(mockTheme);
    });
  });

  describe('getThemeStats', () => {
    it('should return theme statistics', async () => {
      const mockStats = {
        stats: {
          totalThemes: 5,
          activeThemes: 1,
          defaultThemes: 1,
          totalUsage: 100,
          totalExports: 20,
          avgUsage: 20,
        },
        mostUsedThemes: [{ name: 'Ocean Blue', metadata: { usageCount: 50 } }],
        recentThemes: [{ name: 'New Theme', createdAt: new Date() }],
      };

      mockThemeService.getThemeStats.mockResolvedValue(mockStats);

      const result = await controller.getThemeStats();

      expect(service.getThemeStats).toHaveBeenCalled();
      expect(result.message).toBe('Theme statistics retrieved successfully');
      expect(result.data).toEqual(mockStats);
    });
  });

  describe('validateTheme', () => {
    it('should validate valid theme data', async () => {
      const validData: any = {
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      mockThemeService.validateThemeData.mockReturnValue({ valid: true, errors: [] });

      const result = await controller.validateTheme(validData);

      expect(service.validateThemeData).toHaveBeenCalledWith(validData);
      expect(result.message).toBe('Theme validation passed');
      expect(result.data.valid).toBe(true);
    });

    it('should throw error for invalid theme data', async () => {
      const invalidData: any = {};

      mockThemeService.validateThemeData.mockReturnValue({
        valid: false,
        errors: ['Color palette is required'],
      });

      await expect(controller.validateTheme(invalidData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('previewTheme', () => {
    it('should generate theme preview', async () => {
      const previewData: any = {
        colorPalette: mockTheme.colorPalette,
        lightTheme: mockTheme.lightTheme,
        darkTheme: mockTheme.darkTheme,
      };

      const previewResult = {
        css: ':root { --bg-primary: #ffffff; }',
        preview: previewData,
      };

      mockThemeService.previewTheme.mockReturnValue(previewResult);

      const result = await controller.previewTheme(previewData);

      expect(service.previewTheme).toHaveBeenCalledWith(previewData);
      expect(result.message).toBe('Theme preview generated successfully');
      expect(result.data).toEqual(previewResult);
    });
  });
});
