/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let cloudinaryService: CloudinaryService;

  const mockUsersService = {
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
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
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);

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

    it('should update user without image if no file is provided', async () => {
      const expectedResponse = { id: 1, username: 'newname' };
      mockUsersService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(
        idParam,
        userIdFromToken,
        updateUserDto,
        undefined,
      );

      expect(service.update).toHaveBeenCalledWith(
        1,
        userIdFromToken,
        updateUserDto,
      );
      expect(cloudinaryService.uploadImage).not.toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });

    it('should delete old image and upload new one when file is provided', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const existingUser = { id: 1, imagePublicId: 'old_id' };
      const uploadResult = {
        secure_url: 'http://new-url.com',
        public_id: 'new_id',
      };
      const expectedResponse = {
        id: 1,
        ...updateUserDto,
        imagePath: 'http://new-url.com',
      };

      mockUsersService.findOne.mockResolvedValue(existingUser);
      mockCloudinaryService.uploadImage.mockResolvedValue(uploadResult);
      mockUsersService.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(
        idParam,
        userIdFromToken,
        updateUserDto,
        mockFile,
      );

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('old_id');
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(service.update).toHaveBeenCalledWith(
        1,
        userIdFromToken,
        expect.objectContaining({
          imagePath: 'http://new-url.com',
          imagePublicId: 'new_id',
        }),
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should upload image but NOT delete anything if user had no previous image', async () => {
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const userWithoutImage = { id: 1, imagePublicId: null };
      const uploadResult = {
        secure_url: 'http://new-url.com',
        public_id: 'new_id',
      };

      mockUsersService.findOne.mockResolvedValue(userWithoutImage);
      mockCloudinaryService.uploadImage.mockResolvedValue(uploadResult);
      mockUsersService.update.mockResolvedValue({ id: 1 });

      await controller.update(
        idParam,
        userIdFromToken,
        updateUserDto,
        mockFile,
      );

      expect(cloudinaryService.deleteImage).not.toHaveBeenCalled();
      expect(cloudinaryService.uploadImage).toHaveBeenCalled();
    });
  });
});
