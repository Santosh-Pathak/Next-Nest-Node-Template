import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OtpService } from '../../../src/modules/auth/services/otp.service';
import { Otp } from '../../../src/modules/auth/schemas/otp.schema';
import { FactoryService } from '../../../src/shared/services/factory.service';

describe('OtpService', () => {
  let service: OtpService;

  const mockOtpModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockFactoryService = {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getModelToken(Otp.name),
          useValue: mockOtpModel,
        },
        {
          provide: FactoryService,
          useValue: mockFactoryService,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmailOtp', () => {
    const email = 'test@example.com';

    it('should generate 6-digit OTP', async () => {
      mockFactoryService.deleteMany.mockResolvedValue({});
      mockFactoryService.create.mockResolvedValue({});

      const otp = await service.generateEmailOtp(email);

      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });

    it('should delete existing OTPs before creating new one', async () => {
      mockFactoryService.deleteMany.mockResolvedValue({});
      mockFactoryService.create.mockResolvedValue({});

      await service.generateEmailOtp(email);

      expect(mockFactoryService.deleteMany).toHaveBeenCalledWith(expect.anything(), { email });
      expect(mockFactoryService.create).toHaveBeenCalled();
    });

    it('should create OTP with correct expiration time', async () => {
      mockFactoryService.deleteMany.mockResolvedValue({});
      mockFactoryService.create.mockResolvedValue({});

      await service.generateEmailOtp(email, 15);

      expect(mockFactoryService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email,
          otp: expect.any(String),
          expiresIn: expect.any(Date),
        }),
      );
    });

    it('should use default expiration of 10 minutes', async () => {
      mockFactoryService.deleteMany.mockResolvedValue({});
      mockFactoryService.create.mockResolvedValue({});

      const beforeTime = Date.now() + 10 * 60 * 1000;
      await service.generateEmailOtp(email);
      const afterTime = Date.now() + 10 * 60 * 1000;

      const createCall = mockFactoryService.create.mock.calls[0][1];
      const expiresIn = createCall.expiresIn.getTime();

      expect(expiresIn).toBeGreaterThanOrEqual(beforeTime - 1000);
      expect(expiresIn).toBeLessThanOrEqual(afterTime + 1000);
    });
  });

  describe('verifyEmailOtp', () => {
    const email = 'test@example.com';
    const otp = '123456';

    it('should return true for valid OTP', async () => {
      const mockOtpDoc = {
        _id: 'otp-id-123',
        email,
        otp,
        expiresIn: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockFactoryService.findOne.mockResolvedValue(mockOtpDoc);
      mockFactoryService.deleteOne.mockResolvedValue({});

      const result = await service.verifyEmailOtp(email, otp);

      expect(result).toBe(true);
      expect(mockFactoryService.findOne).toHaveBeenCalledWith(expect.anything(), {
        email,
        otp,
        expiresIn: { $gt: expect.any(Date) },
      });
      expect(mockFactoryService.deleteOne).toHaveBeenCalledWith(expect.anything(), {
        _id: mockOtpDoc._id,
      });
    });

    it('should return false for invalid OTP', async () => {
      mockFactoryService.findOne.mockResolvedValue(null);

      const result = await service.verifyEmailOtp(email, 'wrong-otp');

      expect(result).toBe(false);
      expect(mockFactoryService.deleteOne).not.toHaveBeenCalled();
    });

    it('should return false for expired OTP', async () => {
      mockFactoryService.findOne.mockResolvedValue(null);

      const result = await service.verifyEmailOtp(email, otp);

      expect(result).toBe(false);
    });

    it('should delete OTP after successful verification', async () => {
      const mockOtpDoc = {
        _id: 'otp-id-123',
        email,
        otp,
        expiresIn: new Date(Date.now() + 10 * 60 * 1000),
      };

      mockFactoryService.findOne.mockResolvedValue(mockOtpDoc);
      mockFactoryService.deleteOne.mockResolvedValue({});

      await service.verifyEmailOtp(email, otp);

      expect(mockFactoryService.deleteOne).toHaveBeenCalledWith(expect.anything(), {
        _id: mockOtpDoc._id,
      });
    });
  });

  describe('deleteOtpsByEmail', () => {
    it('should delete all OTPs for an email', async () => {
      const email = 'test@example.com';
      mockFactoryService.deleteMany.mockResolvedValue({ deletedCount: 3 });

      await service.deleteOtpsByEmail(email);

      expect(mockFactoryService.deleteMany).toHaveBeenCalledWith(expect.anything(), { email });
    });
  });

  describe('cleanupExpiredOtps', () => {
    it('should delete expired OTPs', async () => {
      mockFactoryService.deleteMany.mockResolvedValue({ deletedCount: 10 });

      await service.cleanupExpiredOtps();

      expect(mockFactoryService.deleteMany).toHaveBeenCalledWith(expect.anything(), {
        expiresIn: { $lt: expect.any(Date) },
      });
    });
  });
});
