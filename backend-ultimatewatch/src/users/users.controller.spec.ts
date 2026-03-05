/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
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
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should call usersService.findOne with numeric id and return the user', async () => {
      const idParam = '10';
      const expectedUser = {
        id: 10,
        username: 'testuser',
        email: 'test@test.com',
      };

      mockUsersService.findOne.mockResolvedValue(expectedUser);

      const result = await controller.findOne(idParam);

      expect(service.findOne).toHaveBeenCalledWith(10);
      expect(result).toEqual(expectedUser);
    });

    it('should return null or handle error if user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('99');

      expect(service.findOne).toHaveBeenCalledWith(99);
      expect(result).toBeNull();
    });
  });
});
