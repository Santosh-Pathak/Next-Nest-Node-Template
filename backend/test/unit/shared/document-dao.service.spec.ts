import { Test, TestingModule } from '@nestjs/testing';
import { DocumentDao } from '@shared/services/document-dao.service';
import mongoose, { Model } from 'mongoose';

describe('DocumentDao', () => {
  let service: DocumentDao;
  let mockModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentDao],
    }).compile();

    service = module.get<DocumentDao>(DocumentDao);

    // Create a comprehensive mock model
    mockModel = {
      create: jest.fn(),
      insertMany: jest.fn(),
      findOne: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndUpdate: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn().mockReturnThis(),
      findOneAndUpdate: jest.fn().mockReturnThis(),
      findOneAndDelete: jest.fn().mockReturnThis(),
      findOneAndReplace: jest.fn().mockReturnThis(),
      updateOne: jest.fn().mockReturnThis(),
      updateMany: jest.fn().mockReturnThis(),
      deleteOne: jest.fn().mockReturnThis(),
      deleteMany: jest.fn().mockReturnThis(),
      countDocuments: jest.fn().mockReturnThis(),
      estimatedDocumentCount: jest.fn().mockReturnThis(),
      aggregate: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      exists: jest.fn(),
      bulkWrite: jest.fn(),
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    } as unknown as Model<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document', async () => {
      const mockData = { name: 'Test', email: 'test@example.com' };
      const mockDocument = {
        ...mockData,
        _id: 'mockId',
        save: jest.fn().mockResolvedValue(mockData),
      };

      // Mock the Model constructor
      const MockModelConstructor = jest.fn().mockImplementation(() => mockDocument);
      const model = MockModelConstructor as any;

      const result = await service.create(model, mockData);

      expect(MockModelConstructor).toHaveBeenCalledWith(mockData);
      expect(mockDocument.save).toHaveBeenCalled();
      expect(result).toBe(mockDocument);
    });

    it('should create a document with select fields', async () => {
      const mockData = { name: 'Test', email: 'test@example.com', password: 'secret' };
      const select = { name: 1, email: 1 };
      const mockDocument = {
        ...mockData,
        _id: 'mockId',
        save: jest.fn().mockResolvedValue(mockData),
        toObject: jest.fn().mockImplementation((options) => {
          if (options?.transform) {
            return options.transform(null, mockData);
          }
          return mockData;
        }),
      };

      const MockModelConstructor = jest.fn().mockImplementation(() => mockDocument);
      const model = MockModelConstructor as any;

      const result = await service.create(model, mockData, select);

      expect(result).toEqual({ name: 'Test', email: 'test@example.com' });
    });
  });

  describe('findOne', () => {
    it('should find one document', async () => {
      const mockDoc = { _id: '1', name: 'Test' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findOne(mockModel, { name: 'Test' });

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test' });
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should find one document with select', async () => {
      const mockDoc = { _id: '1', name: 'Test' };
      mockModel.exec.mockResolvedValue(mockDoc);

      await service.findOne(mockModel, { name: 'Test' }, { select: 'name email' });

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test' });
      expect(mockModel.select).toHaveBeenCalledWith('name email');
      expect(mockModel.exec).toHaveBeenCalled();
    });

    it('should find one document with populate', async () => {
      const mockDoc = { _id: '1', name: 'Test' };
      mockModel.exec.mockResolvedValue(mockDoc);

      await service.findOne(mockModel, { name: 'Test' }, { populate: 'author' });

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test' });
      expect(mockModel.populate).toHaveBeenCalledWith('author');
      expect(mockModel.exec).toHaveBeenCalled();
    });
  });

  describe('findMany', () => {
    it('should find multiple documents', async () => {
      const mockDocs = [
        { _id: '1', name: 'Test1' },
        { _id: '2', name: 'Test2' },
      ];
      mockModel.exec.mockResolvedValue(mockDocs);

      const result = await service.findMany(mockModel, {});

      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDocs);
    });

    it('should find documents with options', async () => {
      const mockDocs = [{ _id: '1', name: 'Test1' }];
      mockModel.exec.mockResolvedValue(mockDocs);

      await service.findMany(
        mockModel,
        {},
        {
          select: 'name',
          limit: 10,
          skip: 5,
          sort: { createdAt: -1 },
          populate: 'author',
        },
      );

      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockModel.select).toHaveBeenCalledWith('name');
      expect(mockModel.limit).toHaveBeenCalledWith(10);
      expect(mockModel.skip).toHaveBeenCalledWith(5);
      expect(mockModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockModel.populate).toHaveBeenCalledWith('author');
      expect(mockModel.exec).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find document by id', async () => {
      const mockDoc = { _id: '123', name: 'Test' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findById(mockModel, '123');

      expect(mockModel.findById).toHaveBeenCalledWith('123');
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should find document by id with populate', async () => {
      const mockDoc = { _id: '123', name: 'Test' };
      mockModel.exec.mockResolvedValue(mockDoc);

      await service.findById(mockModel, '123', { populate: 'author' });

      expect(mockModel.findById).toHaveBeenCalledWith('123');
      expect(mockModel.populate).toHaveBeenCalledWith('author');
      expect(mockModel.exec).toHaveBeenCalled();
    });
  });

  describe('updateOne', () => {
    it('should update one document', async () => {
      const mockDoc = { _id: '1', name: 'Updated' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.updateOne(mockModel, { _id: '1' }, { name: 'Updated' });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '1' },
        { name: 'Updated' },
        { new: true },
      );
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('updateMany', () => {
    it('should update many documents', async () => {
      const mockResult = { modifiedCount: 5 };
      mockModel.exec.mockResolvedValue(mockResult);

      const result = await service.updateMany(
        mockModel,
        { status: 'active' },
        { status: 'inactive' },
      );

      expect(mockModel.updateMany).toHaveBeenCalledWith(
        { status: 'active' },
        { status: 'inactive' },
        {},
      );
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteOne', () => {
    it('should delete one document', async () => {
      const mockResult = { deletedCount: 1 };
      mockModel.exec.mockResolvedValue(mockResult);

      const result = await service.deleteOne(mockModel, { _id: '1' });

      expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: '1' });
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteMany', () => {
    it('should delete many documents', async () => {
      const mockResult = { deletedCount: 5 };
      mockModel.exec.mockResolvedValue(mockResult);

      const result = await service.deleteMany(mockModel, { status: 'inactive' });

      expect(mockModel.deleteMany).toHaveBeenCalledWith({ status: 'inactive' });
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('count', () => {
    it('should count documents', async () => {
      mockModel.exec.mockResolvedValue(10);

      const result = await service.count(mockModel, { status: 'active' });

      expect(mockModel.countDocuments).toHaveBeenCalledWith({ status: 'active' });
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });

  describe('countDocuments', () => {
    it('should count documents', async () => {
      mockModel.exec.mockResolvedValue(15);

      const result = await service.countDocuments(mockModel, { status: 'active' });

      expect(mockModel.countDocuments).toHaveBeenCalledWith({ status: 'active' });
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toBe(15);
    });
  });

  describe('estimatedDocumentCount', () => {
    it('should get estimated document count', async () => {
      mockModel.exec.mockResolvedValue(1000);

      const result = await service.estimatedDocumentCount(mockModel);

      expect(mockModel.estimatedDocumentCount).toHaveBeenCalled();
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toBe(1000);
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should find by id and update', async () => {
      const mockDoc = { _id: '123', name: 'Updated' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findByIdAndUpdate(mockModel, '123', { name: 'Updated' });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { name: 'Updated' },
        { new: true },
      );
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findByIdAndDelete', () => {
    it('should find by id and delete', async () => {
      const mockDoc = { _id: '123', name: 'Deleted' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findByIdAndDelete(mockModel, '123');

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findOneAndDelete', () => {
    it('should find one and delete', async () => {
      const mockDoc = { _id: '123', name: 'Deleted' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findOneAndDelete(mockModel, { name: 'Test' });

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ name: 'Test' });
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findOneAndUpdate', () => {
    it('should find one and update', async () => {
      const mockDoc = { _id: '123', name: 'Updated' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findOneAndUpdate(mockModel, { _id: '123' }, { name: 'Updated' });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '123' },
        { name: 'Updated' },
        { new: true },
      );
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findOneAndReplace', () => {
    it('should find one and replace', async () => {
      const mockDoc = { _id: '123', name: 'Replaced' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findOneAndReplace(
        mockModel,
        { _id: '123' },
        { name: 'Replaced' },
      );

      expect(mockModel.findOneAndReplace).toHaveBeenCalledWith(
        { _id: '123' },
        { name: 'Replaced' },
        { new: true },
      );
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('aggregate', () => {
    it('should execute aggregation pipeline', async () => {
      const mockResult = [{ count: 10 }];
      mockModel.exec.mockResolvedValue(mockResult);

      const pipeline = [{ $match: { status: 'active' } }, { $count: 'count' }];
      const result = await service.aggregate(mockModel, pipeline);

      expect(mockModel.aggregate).toHaveBeenCalledWith(pipeline);
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('distinct', () => {
    it('should get distinct values', async () => {
      const mockResult = ['value1', 'value2', 'value3'];
      mockModel.exec.mockResolvedValue(mockResult);

      const result = await service.distinct(mockModel, 'category', { status: 'active' });

      expect(mockModel.distinct).toHaveBeenCalledWith('category', { status: 'active' });
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('exists', () => {
    it('should return true if document exists', async () => {
      mockModel.exists.mockResolvedValue({ _id: '123' });

      const result = await service.exists(mockModel, { name: 'Test' });

      expect(mockModel.exists).toHaveBeenCalledWith({ name: 'Test' });
      expect(result).toBe(true);
    });

    it('should return false if document does not exist', async () => {
      mockModel.exists.mockResolvedValue(null);

      const result = await service.exists(mockModel, { name: 'NonExistent' });

      expect(mockModel.exists).toHaveBeenCalledWith({ name: 'NonExistent' });
      expect(result).toBe(false);
    });
  });

  describe('createMany', () => {
    it('should create many documents', async () => {
      const mockData = [{ name: 'Test1' }, { name: 'Test2' }, { name: 'Test3' }];
      const mockResult = mockData.map((d, i) => ({ ...d, _id: `id${i}` }));
      mockModel.insertMany.mockResolvedValue(mockResult);

      const result = await service.createMany(mockModel, mockData);

      expect(mockModel.insertMany).toHaveBeenCalledWith(mockData, {});
      expect(result).toEqual(mockResult);
    });
  });

  describe('bulkWrite', () => {
    it('should execute bulk write operations', async () => {
      const operations = [
        { insertOne: { document: { name: 'Test' } } },
        { updateOne: { filter: { _id: '1' }, update: { $set: { name: 'Updated' } } } },
      ];
      const mockResult = { insertedCount: 1, modifiedCount: 1 };
      mockModel.bulkWrite.mockResolvedValue(mockResult);

      const result = await service.bulkWrite(mockModel, operations);

      expect(mockModel.bulkWrite).toHaveBeenCalledWith(operations, {});
      expect(result).toEqual(mockResult);
    });
  });

  describe('paginate', () => {
    it('should paginate documents with defaults', async () => {
      const mockDocs = [{ _id: '1', name: 'Test1' }];
      mockModel.exec.mockResolvedValueOnce(mockDocs).mockResolvedValueOnce(25);

      const result = await service.paginate(mockModel, {});

      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockModel.skip).toHaveBeenCalledWith(0);
      expect(mockModel.limit).toHaveBeenCalledWith(10);
      expect(result.data).toEqual(mockDocs);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(false);
    });

    it('should paginate with custom options', async () => {
      const mockDocs = [{ _id: '1', name: 'Test1' }];
      mockModel.exec.mockResolvedValueOnce(mockDocs).mockResolvedValueOnce(50);

      const result = await service.paginate(
        mockModel,
        { status: 'active' },
        {
          page: 2,
          limit: 20,
          sort: { name: 1 },
          select: 'name email',
          populate: 'author',
        },
      );

      expect(mockModel.find).toHaveBeenCalledWith({ status: 'active' });
      expect(mockModel.sort).toHaveBeenCalledWith({ name: 1 });
      expect(mockModel.skip).toHaveBeenCalledWith(20);
      expect(mockModel.limit).toHaveBeenCalledWith(20);
      expect(mockModel.select).toHaveBeenCalledWith('name email');
      expect(mockModel.populate).toHaveBeenCalledWith('author');
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
    });
  });

  describe('findOneOrCreate', () => {
    it('should return existing document if found', async () => {
      const mockDoc = { _id: '123', name: 'Existing' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findOneOrCreate(
        mockModel,
        { name: 'Existing' },
        { name: 'Existing', email: 'test@example.com' },
      );

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Existing' });
      expect(mockModel.create).not.toHaveBeenCalled();
      expect(result.doc).toEqual(mockDoc);
      expect(result.created).toBe(false);
    });

    it('should create new document if not found', async () => {
      const mockNewDoc = { _id: '123', name: 'New', email: 'new@example.com' };
      mockModel.exec.mockResolvedValue(null);
      mockModel.create.mockResolvedValue(mockNewDoc);

      const result = await service.findOneOrCreate(
        mockModel,
        { name: 'New' },
        { name: 'New', email: 'new@example.com' },
      );

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'New' });
      expect(mockModel.create).toHaveBeenCalledWith({ name: 'New', email: 'new@example.com' });
      expect(result.doc).toEqual(mockNewDoc);
      expect(result.created).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a document', async () => {
      const mockDoc = { _id: '123', deleted: true };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.softDelete(mockModel, { _id: '123' });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '123' },
        expect.objectContaining({
          deleted: true,
          deletedAt: expect.any(Date),
        }),
        { new: true },
      );
      expect(result).toEqual(mockDoc);
    });
  });

  describe('restore', () => {
    it('should restore a soft deleted document', async () => {
      const mockDoc = { _id: '123', deleted: false };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.restore(mockModel, { _id: '123' });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: '123' },
        { deleted: false, deletedAt: null },
        { new: true },
      );
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findLean', () => {
    it('should find documents with lean', async () => {
      const mockDocs = [{ _id: '1', name: 'Test1' }];
      mockModel.exec.mockResolvedValue(mockDocs);

      const result = await service.findLean(mockModel, {});

      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockModel.lean).toHaveBeenCalled();
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDocs);
    });

    it('should find documents with lean and options', async () => {
      const mockDocs = [{ _id: '1', name: 'Test1' }];
      mockModel.exec.mockResolvedValue(mockDocs);

      await service.findLean(
        mockModel,
        {},
        {
          select: 'name',
          limit: 10,
          skip: 5,
          sort: { createdAt: -1 },
          populate: 'author',
        },
      );

      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockModel.lean).toHaveBeenCalled();
      expect(mockModel.select).toHaveBeenCalledWith('name');
      expect(mockModel.limit).toHaveBeenCalledWith(10);
      expect(mockModel.skip).toHaveBeenCalledWith(5);
      expect(mockModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockModel.populate).toHaveBeenCalledWith('author');
    });
  });

  describe('findOneLean', () => {
    it('should find one document with lean', async () => {
      const mockDoc = { _id: '1', name: 'Test' };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await service.findOneLean(mockModel, { name: 'Test' });

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test' });
      expect(mockModel.lean).toHaveBeenCalled();
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });

    it('should find one document with lean and options', async () => {
      const mockDoc = { _id: '1', name: 'Test' };
      mockModel.exec.mockResolvedValue(mockDoc);

      await service.findOneLean(
        mockModel,
        { name: 'Test' },
        {
          select: 'name email',
          populate: 'author',
        },
      );

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test' });
      expect(mockModel.lean).toHaveBeenCalled();
      expect(mockModel.select).toHaveBeenCalledWith('name email');
      expect(mockModel.populate).toHaveBeenCalledWith('author');
    });
  });

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };

      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

      const callback = jest.fn().mockResolvedValue('success');
      const result = await service.transaction(callback);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockSession);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should abort transaction on error', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };

      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);

      const error = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(error);

      await expect(service.transaction(callback)).rejects.toThrow('Transaction failed');

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockSession);
      expect(mockSession.commitTransaction).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
