import { NotFoundException } from '@nestjs/common';
import { BaseService } from '@shared/services/base.service';
import { FactoryService } from '@shared/services/factory.service';
import { Document, Model } from 'mongoose';

// Mock document class for testing
class TestDocument extends Document {
  name: string;
  email: string;
}

// Concrete implementation of BaseService for testing
class TestService extends BaseService<TestDocument> {
  constructor(model: Model<TestDocument>, factoryService: FactoryService) {
    super(model, factoryService);
  }
}

describe('BaseService', () => {
  let service: TestService;
  let mockModel: any;
  let mockFactoryService: jest.Mocked<FactoryService>;

  beforeEach(async () => {
    mockModel = {
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      exec: jest.fn(),
      schema: {
        path: jest.fn(),
      },
    };

    mockFactoryService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    } as any;

    service = new TestService(mockModel, mockFactoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document', async () => {
      const createDto = { name: 'Test', email: 'test@example.com' };
      const mockDoc = { _id: '123', ...createDto };
      mockFactoryService.create.mockResolvedValue(mockDoc);

      const result = await service.create(createDto);

      expect(mockFactoryService.create).toHaveBeenCalledWith(mockModel, createDto);
      expect(result).toEqual(mockDoc);
    });

    it('should handle creation with nested data', async () => {
      const createDto = {
        name: 'Test',
        email: 'test@example.com',
        address: { city: 'New York', country: 'USA' },
      };
      const mockDoc = { _id: '123', ...createDto };
      mockFactoryService.create.mockResolvedValue(mockDoc);

      const result = await service.create(createDto);

      expect(mockFactoryService.create).toHaveBeenCalledWith(mockModel, createDto);
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findById', () => {
    it('should find document by id', async () => {
      const mockDoc = { _id: '123', name: 'Test', email: 'test@example.com' };
      mockFactoryService.findById.mockResolvedValue(mockDoc);

      const result = await service.findById('123');

      expect(mockFactoryService.findById).toHaveBeenCalledWith(mockModel, '123', {});
      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockFactoryService.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Document not found with that ID',
      );
    });

    it('should find document with populate options', async () => {
      const mockDoc = { _id: '123', name: 'Test', author: { name: 'Author' } };
      mockFactoryService.findById.mockResolvedValue(mockDoc);
      const populateOptions = { path: 'author', select: 'name' };

      const result = await service.findById('123', populateOptions);

      expect(mockFactoryService.findById).toHaveBeenCalledWith(mockModel, '123', {
        populate: populateOptions,
      });
      expect(result).toEqual(mockDoc);
    });

    it('should find document with array of populate options', async () => {
      const mockDoc = { _id: '123', name: 'Test' };
      mockFactoryService.findById.mockResolvedValue(mockDoc);
      const populateOptions = [
        { path: 'author', select: 'name' },
        { path: 'category', select: 'title' },
      ];

      const result = await service.findById('123', populateOptions);

      expect(mockFactoryService.findById).toHaveBeenCalledWith(mockModel, '123', {
        populate: populateOptions,
      });
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findAll', () => {
    it('should find all documents with default options', async () => {
      const mockDocs = [
        { _id: '1', name: 'Test1' },
        { _id: '2', name: 'Test2' },
      ];

      // Mock the APIFeatures chain
      const mockAPIFeatures = {
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        search: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        calculateTotalCount: jest.fn().mockResolvedValue(undefined),
        execute: jest.fn().mockResolvedValue(mockDocs),
        getLimit: jest.fn().mockReturnValue(100),
        getCurrentPage: jest.fn().mockReturnValue(1),
        getTotalPages: jest.fn().mockReturnValue(1),
        totalCount: 2,
      };

      // Mock APIFeatures constructor
      jest
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .spyOn(require('@shared/utils/api-features'), 'APIFeatures')
        .mockImplementation(() => mockAPIFeatures);

      const result = await service.findAll({});

      expect(result.data).toEqual(mockDocs);
      expect(result.meta.results).toBe(2);
      expect(result.meta.totalCount).toBe(2);
    });

    it('should find documents with pagination', async () => {
      const mockDocs = [{ _id: '1', name: 'Test1' }];

      const mockAPIFeatures = {
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        search: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        calculateTotalCount: jest.fn().mockResolvedValue(undefined),
        execute: jest.fn().mockResolvedValue(mockDocs),
        getLimit: jest.fn().mockReturnValue(10),
        getCurrentPage: jest.fn().mockReturnValue(2),
        getTotalPages: jest.fn().mockReturnValue(5),
        totalCount: 50,
      };

      jest
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .spyOn(require('@shared/utils/api-features'), 'APIFeatures')
        .mockImplementation(() => mockAPIFeatures);

      const result = await service.findAll({ page: '2', limit: '10' });

      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.totalCount).toBe(50);
    });

    it('should apply populate options', async () => {
      const mockDocs = [{ _id: '1', name: 'Test1', author: { name: 'Author' } }];

      const mockAPIFeatures = {
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        search: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        calculateTotalCount: jest.fn().mockResolvedValue(undefined),
        execute: jest.fn().mockResolvedValue(mockDocs),
        getLimit: jest.fn().mockReturnValue(100),
        getCurrentPage: jest.fn().mockReturnValue(1),
        getTotalPages: jest.fn().mockReturnValue(1),
        totalCount: 1,
      };

      jest
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .spyOn(require('@shared/utils/api-features'), 'APIFeatures')
        .mockImplementation(() => mockAPIFeatures);

      const populateOptions = { path: 'author', select: 'name' };
      await service.findAll({}, populateOptions);

      expect(mockAPIFeatures.populate).toHaveBeenCalledWith(populateOptions);
    });
  });

  describe('update', () => {
    it('should update a document', async () => {
      const mockDoc = {
        _id: '123',
        name: 'Old Name',
        email: 'old@example.com',
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockFactoryService.findById.mockResolvedValue(mockDoc);

      const updateDto = { name: 'New Name', email: 'new@example.com' };
      const result = await service.update('123', updateDto);

      expect(mockFactoryService.findById).toHaveBeenCalledWith(mockModel, '123');
      expect(mockDoc.save).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundException when document not found', async () => {
      mockFactoryService.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        'Document not found with that ID',
      );
    });

    it('should update partial fields', async () => {
      const mockDoc = {
        _id: '123',
        name: 'Old Name',
        email: 'old@example.com',
        role: 'user',
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockFactoryService.findById.mockResolvedValue(mockDoc);

      const updateDto = { name: 'New Name' };
      await service.update('123', updateDto);

      expect(mockDoc.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a document', async () => {
      const mockDoc = { _id: '123', name: 'Test' };
      mockFactoryService.findByIdAndDelete.mockResolvedValue(mockDoc);

      await service.delete('123');

      expect(mockFactoryService.findByIdAndDelete).toHaveBeenCalledWith(mockModel, '123');
    });

    it('should throw NotFoundException when document not found', async () => {
      mockFactoryService.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.delete('nonexistent')).rejects.toThrow(
        'Document not found with that ID',
      );
    });
  });

  describe('integration with FactoryService', () => {
    it('should use factory service for all database operations', async () => {
      const createDto = { name: 'Test', email: 'test@example.com' };
      const mockDoc = { _id: '123', ...createDto, save: jest.fn() };

      mockFactoryService.create.mockResolvedValue(mockDoc);
      mockFactoryService.findById.mockResolvedValue(mockDoc);
      mockFactoryService.findByIdAndDelete.mockResolvedValue(mockDoc);

      // Test create
      await service.create(createDto);
      expect(mockFactoryService.create).toHaveBeenCalled();

      // Test findById
      await service.findById('123');
      expect(mockFactoryService.findById).toHaveBeenCalled();

      // Test update
      await service.update('123', { name: 'Updated' });
      expect(mockFactoryService.findById).toHaveBeenCalled();

      // Test delete
      await service.delete('123');
      expect(mockFactoryService.findByIdAndDelete).toHaveBeenCalled();
    });
  });
});
