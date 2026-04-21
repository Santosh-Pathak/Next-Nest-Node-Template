import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/modules/users/controllers/users.controller';
import { UsersService } from '../../../src/modules/users/services/users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    createUser: jest.fn(),
    findAllUsers: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const expectedUser = { id: '1', ...createUserDto };
      mockUsersService.createUser.mockResolvedValue(expectedUser);

      const result = await controller.create(createUserDto);

      expect(result.message).toBe('User created successfully');
      expect(result.data).toEqual(expectedUser);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });
});
