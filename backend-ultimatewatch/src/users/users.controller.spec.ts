/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
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

    jest.clearAllMocks();
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

  describe('remove', () => {
    it('should call usersService.remove with numeric id and authenticated userId', async () => {
      const idParam = '10';
      const userIdFromToken = 10;
      const expectedResponse = { message: 'Account deleted successfully' };

      mockUsersService.remove = jest.fn().mockResolvedValue(expectedResponse);

      const result = await controller.remove(idParam, userIdFromToken);

      expect(service.remove).toHaveBeenCalledWith(10, userIdFromToken);
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate exceptions from the service (e.g., ResourceNotOwnedException)', async () => {
      const idParam = '20';
      const userIdFromToken = 10;

      mockUsersService.remove.mockRejectedValue(
        new Error('ResourceNotOwnedException'),
      );

      await expect(controller.remove(idParam, userIdFromToken)).rejects.toThrow(
        'ResourceNotOwnedException',
      );

      expect(service.remove).toHaveBeenCalledWith(20, 10);
    });
  });

  describe('update', () => {
    const idParam = '1';
    const userIdFromToken = 1;
    const updateUserDto: UpdateUserDto = { username: 'newname' };

    it('should call usersService.update with numeric id, userId, dto and file', async () => {
      const expectedResponse = { id: 1, username: 'newname' };
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;

      mockUsersService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(
        idParam,
        userIdFromToken,
        updateUserDto,
        mockFile,
      );

      expect(mockUsersService.update).toHaveBeenCalledWith(
        1,
        userIdFromToken,
        updateUserDto,
        mockFile,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should work correctly when no file is provided', async () => {
      const expectedResponse = { id: 1, username: 'newname' };

      mockUsersService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(
        idParam,
        userIdFromToken,
        updateUserDto,
        undefined,
      );

      expect(mockUsersService.update).toHaveBeenCalledWith(
        1,
        userIdFromToken,
        updateUserDto,
        undefined,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from the service', async () => {
      mockUsersService.update.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        controller.update(idParam, userIdFromToken, updateUserDto, undefined),
      ).rejects.toThrow('Unauthorized');
    });
  });
});
