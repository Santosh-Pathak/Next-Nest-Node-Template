import { APIFeatures } from '@shared/utils/api-features';
import { FactoryService } from '@shared/services/factory.service';

jest.mock('@shared/services/factory.service');

describe('APIFeatures', () => {
  let mockModel: any;
  let mockFactoryService: jest.Mocked<FactoryService>;

  beforeEach(() => {
    mockModel = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      schema: {
        path: jest.fn(),
      },
    };

    mockFactoryService = {
      countDocuments: jest.fn(),
    } as any;

    (FactoryService as jest.Mock).mockImplementation(() => mockFactoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('filter', () => {
    it('should apply basic filter', () => {
      const queryString = { status: 'active', role: 'admin' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.filter();

      expect(apiFeatures['filterQuery']).toEqual({ status: 'active', role: 'admin' });
    });

    it('should exclude special fields from filter', () => {
      const queryString = {
        status: 'active',
        page: '1',
        limit: '10',
        sort: 'name',
        fields: 'name,email',
        search: 'test',
        searchFields: 'name',
      };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.filter();

      expect(apiFeatures['filterQuery']).toEqual({ status: 'active' });
      expect(apiFeatures['filterQuery']).not.toHaveProperty('page');
      expect(apiFeatures['filterQuery']).not.toHaveProperty('limit');
      expect(apiFeatures['filterQuery']).not.toHaveProperty('sort');
    });

    it('should handle empty values', () => {
      const queryString = { status: '', email: '' };
      const apiFeatures = new APIFeatures(mockModel, queryString as any);

      apiFeatures.filter();

      expect(apiFeatures['filterQuery']).toEqual({
        status: { $exists: true, $ne: null },
        email: { $exists: true, $ne: null },
      });
    });

    it('should convert query operators', () => {
      const queryString = {
        age: { gte: '18', lte: '65' },
        price: { gt: '100', lt: '1000' },
      };
      const apiFeatures = new APIFeatures(mockModel, queryString as any);

      apiFeatures.filter();

      expect(apiFeatures['filterQuery']).toEqual({
        age: { $gte: '18', $lte: '65' },
        price: { $gt: '100', $lt: '1000' },
      });
    });
  });

  describe('sort', () => {
    it('should apply default sort', () => {
      const apiFeatures = new APIFeatures(mockModel, {});

      apiFeatures.sort();

      expect(apiFeatures['sortOptions']).toEqual({ createdAt: -1 });
    });

    it('should apply custom sort', () => {
      const queryString = { sort: 'name,-createdAt' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.sort();

      expect(apiFeatures['sortOptions']).toBe('name -createdAt');
    });

    it('should handle single sort field', () => {
      const queryString = { sort: 'email' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.sort();

      expect(apiFeatures['sortOptions']).toBe('email');
    });
  });

  describe('limitFields', () => {
    it('should apply default field selection', () => {
      const apiFeatures = new APIFeatures(mockModel, {});

      apiFeatures.limitFields();

      expect(apiFeatures['selectFields']).toBe('-__v');
    });

    it('should apply custom field selection', () => {
      const queryString = { fields: 'name,email,role' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.limitFields();

      expect(apiFeatures['selectFields']).toBe('name email role');
    });

    it('should handle single field', () => {
      const queryString = { fields: 'name' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.limitFields();

      expect(apiFeatures['selectFields']).toBe('name');
    });
  });

  describe('paginate', () => {
    it('should apply default pagination', () => {
      const apiFeatures = new APIFeatures(mockModel, {});

      apiFeatures.paginate();

      expect(apiFeatures['skipValue']).toBe(0);
      expect(apiFeatures['limitValue']).toBe(100);
    });

    it('should apply custom pagination', () => {
      const queryString = { page: '3', limit: '20' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.paginate();

      expect(apiFeatures['skipValue']).toBe(40); // (3-1) * 20
      expect(apiFeatures['limitValue']).toBe(20);
    });

    it('should handle page 1', () => {
      const queryString = { page: '1', limit: '10' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.paginate();

      expect(apiFeatures['skipValue']).toBe(0);
      expect(apiFeatures['limitValue']).toBe(10);
    });

    it('should handle string page numbers', () => {
      const queryString = { page: '5', limit: '25' };
      const apiFeatures = new APIFeatures(mockModel, queryString);

      apiFeatures.paginate();

      expect(apiFeatures['skipValue']).toBe(100); // (5-1) * 25
      expect(apiFeatures['limitValue']).toBe(25);
    });
  });

  describe('populate', () => {
    it('should add single populate option', () => {
      const apiFeatures = new APIFeatures(mockModel, {});
      const populateOptions = { path: 'author', select: 'name email' };

      apiFeatures.populate(populateOptions);

      expect(apiFeatures['populateOptions']).toContainEqual(populateOptions);
    });

    it('should add multiple populate options', () => {
      const apiFeatures = new APIFeatures(mockModel, {});
      const options1 = { path: 'author', select: 'name' };
      const options2 = { path: 'category', select: 'title' };

      apiFeatures.populate(options1);
      apiFeatures.populate(options2);

      expect(apiFeatures['populateOptions']).toContainEqual(options1);
      expect(apiFeatures['populateOptions']).toContainEqual(options2);
    });
  });

  describe('calculateTotalCount', () => {
    it('should calculate total count using factory service', async () => {
      mockFactoryService.countDocuments.mockResolvedValue(50);
      const apiFeatures = new APIFeatures(mockModel, { status: 'active' });
      apiFeatures.filter();

      await apiFeatures.calculateTotalCount();

      expect(mockFactoryService.countDocuments).toHaveBeenCalledWith(mockModel, {
        status: 'active',
      });
      expect(apiFeatures.totalCount).toBe(50);
    });

    it('should return this for chaining', async () => {
      mockFactoryService.countDocuments.mockResolvedValue(25);
      const apiFeatures = new APIFeatures(mockModel, {});

      const result = await apiFeatures.calculateTotalCount();

      expect(result).toBe(apiFeatures);
    });
  });

  describe('execute', () => {
    it('should execute query with all options', async () => {
      const mockData = [{ _id: '1', name: 'Test' }];
      mockModel.exec.mockResolvedValue(mockData);

      const apiFeatures = new APIFeatures(mockModel, {
        page: '2',
        limit: '10',
        sort: 'name',
        fields: 'name,email',
      });

      apiFeatures.filter().sort().limitFields().paginate();
      const result = await apiFeatures.execute();

      expect(mockModel.find).toHaveBeenCalled();
      expect(mockModel.select).toHaveBeenCalledWith('name email');
      expect(mockModel.sort).toHaveBeenCalledWith('name');
      expect(mockModel.skip).toHaveBeenCalledWith(10);
      expect(mockModel.limit).toHaveBeenCalledWith(10);
      expect(mockModel.exec).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should execute query with populate', async () => {
      const mockData = [{ _id: '1', name: 'Test', author: { name: 'Author' } }];
      mockModel.exec.mockResolvedValue(mockData);

      const apiFeatures = new APIFeatures(mockModel, {});
      apiFeatures.populate({ path: 'author', select: 'name' });

      const result = await apiFeatures.execute();

      expect(mockModel.populate).toHaveBeenCalledWith({ path: 'author', select: 'name' });
      expect(result).toEqual(mockData);
    });

    it('should handle multiple populate options', async () => {
      const mockData = [{ _id: '1', name: 'Test' }];
      mockModel.exec.mockResolvedValue(mockData);

      const apiFeatures = new APIFeatures(mockModel, {});
      apiFeatures.populate({ path: 'author' });
      apiFeatures.populate({ path: 'category' });

      await apiFeatures.execute();

      expect(mockModel.populate).toHaveBeenCalledTimes(2);
      expect(mockModel.populate).toHaveBeenCalledWith({ path: 'author' });
      expect(mockModel.populate).toHaveBeenCalledWith({ path: 'category' });
    });
  });

  describe('getLimit', () => {
    it('should return default limit', () => {
      const apiFeatures = new APIFeatures(mockModel, {});

      expect(apiFeatures.getLimit()).toBe(100);
    });

    it('should return custom limit', () => {
      const apiFeatures = new APIFeatures(mockModel, { limit: '25' });
      apiFeatures.paginate();

      expect(apiFeatures.getLimit()).toBe(25);
    });
  });

  describe('getCurrentPage', () => {
    it('should return default page', () => {
      const apiFeatures = new APIFeatures(mockModel, {});

      expect(apiFeatures.getCurrentPage()).toBe(1);
    });

    it('should return custom page', () => {
      const apiFeatures = new APIFeatures(mockModel, { page: '5' });
      apiFeatures.paginate();

      expect(apiFeatures.getCurrentPage()).toBe(5);
    });
  });

  describe('getTotalPages', () => {
    it('should calculate total pages correctly', () => {
      const apiFeatures = new APIFeatures(mockModel, { limit: '10' });
      apiFeatures.paginate();
      apiFeatures.totalCount = 45;

      expect(apiFeatures.getTotalPages()).toBe(5); // Math.ceil(45/10)
    });

    it('should return 0 when no items', () => {
      const apiFeatures = new APIFeatures(mockModel, {});
      apiFeatures.totalCount = 0;

      expect(apiFeatures.getTotalPages()).toBe(0);
    });

    it('should handle exact division', () => {
      const apiFeatures = new APIFeatures(mockModel, { limit: '20' });
      apiFeatures.paginate();
      apiFeatures.totalCount = 100;

      expect(apiFeatures.getTotalPages()).toBe(5);
    });
  });

  describe('method chaining', () => {
    it('should allow method chaining', () => {
      const apiFeatures = new APIFeatures(mockModel, {
        status: 'active',
        sort: 'name',
        fields: 'name,email',
        page: '2',
        limit: '10',
      });

      const result = apiFeatures.filter().sort().limitFields().paginate();

      expect(result).toBe(apiFeatures);
      expect(apiFeatures['filterQuery']).toEqual({ status: 'active' });
      expect(apiFeatures['sortOptions']).toBe('name');
      expect(apiFeatures['selectFields']).toBe('name email');
      expect(apiFeatures['skipValue']).toBe(10);
      expect(apiFeatures['limitValue']).toBe(10);
    });
  });
});
