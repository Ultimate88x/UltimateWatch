import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import * as bcrypt from 'bcrypt';
import { ObjectLiteral } from 'typeorm';
import { ResourceNotOwnedException } from 'src/common/exceptions/resource-not-owned-exception';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { DuplicatedResourceException } from 'src/common/exceptions/duplicated-resource-exception';
import { CreateUserDto } from './dto/create-user.dto';
import { BadRequestException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestsService } from 'src/requests/requests.service';

jest.mock('bcrypt');

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  const mockQueryBuilder = {
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const createMockRepository = (): MockRepository<User> => ({
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    delete: jest.fn(),
    findOneBy: jest.fn(),
    merge: jest.fn(),
    update: jest.fn(),
  });

  const mockCloudinaryService = {
    updateDtoImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  const mockRequestsService = {
    getRelationStatus: jest.fn().mockResolvedValue('none'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<MockRepository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUsername', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: 1, username: 'testuser' } as User;

      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      // Verificamos que se llamó al QueryBuilder correctamente
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    });

    it('should throw ResourceNotFoundException if user not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findByUsername('nonexistent')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('getUserByUsername', () => {
    it('should return a UserDetailDto if found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
      } as User;

      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.getUserByUsername('testuser', 1);

      expect(result.username).toBe('testuser');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('create', () => {
    it('should hash password and save user if no duplicates exist', async () => {
      const dto = {
        username: 'newuser',
        email: 'test@test.com',
        password: 'password123',
      };
      repository.findOne?.mockResolvedValue(null);
      repository.save?.mockResolvedValue({ ...dto, id: 1 });

      await service.create(dto as CreateUserDto);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw DuplicatedResourceException if username is taken', async () => {
      repository.findOne?.mockResolvedValue({ id: 99, username: 'taken' });
      await expect(
        service.create({ username: 'taken' } as CreateUserDto),
      ).rejects.toThrow(DuplicatedResourceException);
    });
  });

  describe('findById', () => {
    it('should return a user entity', async () => {
      const mockUser = { id: 1, username: 'test' } as User;
      repository.findOne?.mockResolvedValue(mockUser);
      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      repository.findOne?.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('remove', () => {
    const idToDelete = 1;
    const authenticatedUserId = 1;

    it('should delete the user and their image if the id matches the userId (Success)', async () => {
      const mockUserWithImage = {
        id: 1,
        username: 'test',
        imagePublicId: 'cloudinary_123',
      } as User;

      repository.findOneBy?.mockResolvedValue(mockUserWithImage);
      repository.delete?.mockResolvedValue({ affected: 1 });
      mockCloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });

      const result = await service.remove(idToDelete, authenticatedUserId);

      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith(
        'cloudinary_123',
      );
      expect(repository.delete).toHaveBeenCalledWith(idToDelete);
      expect(result).toEqual({ message: 'Account deleted successfully' });
    });

    it('should delete the user even if they do not have an image', async () => {
      const mockUserWithoutImage = {
        id: 1,
        username: 'test',
        imagePublicId: null,
      } as unknown as User;

      repository.findOneBy?.mockResolvedValue(mockUserWithoutImage);
      repository.delete?.mockResolvedValue({ affected: 1 });

      await service.remove(idToDelete, authenticatedUserId);
      expect(mockCloudinaryService.deleteImage).not.toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith(idToDelete);
    });

    it('should throw ResourceNotOwnedException if id does not match userId (Failure)', async () => {
      const idToDelete = 5;
      const authenticatedUserId = 1;

      await expect(
        service.remove(idToDelete, authenticatedUserId),
      ).rejects.toThrow(ResourceNotOwnedException);

      expect(repository.findOneBy).not.toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw ResourceNotFoundException if user to remove does not exist in DB', async () => {
      repository.findOneBy?.mockResolvedValue(null);

      await expect(service.remove(1, 1)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('update', () => {
    const id = 1;
    const userId = 1;
    const existingUser = {
      id: 1,
      username: 'oldName',
      email: 'test@test.com',
      password: 'oldHash',
      imagePublicId: 'old_public_id' as string | null,
    } as User;

    it('should throw ResourceNotOwnedException if id does not match userId', async () => {
      await expect(service.update(1, 2, { username: 'new' })).rejects.toThrow(
        ResourceNotOwnedException,
      );
    });

    it('should throw ResourceNotFoundException if user to update does not exist', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.update(1, 1, { username: 'new' })).rejects.toThrow(
        ResourceNotFoundException,
      );
    });

    it('should delete old image and update DTO if a new file is provided', async () => {
      const dto = { username: 'updatedName' };
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const updatedDtoWithImage = {
        ...dto,
        imagePath: 'new_url',
        imagePublicId: 'new_id',
      };

      repository.findOne?.mockResolvedValue(existingUser);
      mockCloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });
      mockCloudinaryService.updateDtoImage.mockResolvedValue(
        updatedDtoWithImage,
      );

      repository.merge?.mockImplementation(
        (entity: User, changes: Partial<User>) => ({
          ...entity,
          ...changes,
        }),
      );
      repository.save?.mockImplementation((user) => Promise.resolve(user));

      const result = await service.update(id, userId, dto, mockFile);

      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith(
        'old_public_id',
      );
      expect(mockCloudinaryService.updateDtoImage).toHaveBeenCalledWith(
        dto,
        mockFile,
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          imagePath: 'new_url',
          imagePublicId: 'new_id',
        }),
      );
      expect(result?.imagePath).toBe('new_url');
    });

    it('should NOT call deleteImage if user had no previous image but a file is provided', async () => {
      const userWithoutImage = { ...existingUser, imagePublicId: null };
      const dto = { username: 'newName' };
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;

      repository.findOne?.mockResolvedValue(userWithoutImage);

      mockCloudinaryService.updateDtoImage.mockResolvedValue({
        ...dto,
        imagePath: 'url',
      });
      repository.save?.mockImplementation((user) => Promise.resolve(user));

      await service.update(id, userId, dto, mockFile);

      expect(mockCloudinaryService.deleteImage).not.toHaveBeenCalled();
      expect(mockCloudinaryService.updateDtoImage).toHaveBeenCalled();
    });

    it('should hash password and update user if oldPassword is correct', async () => {
      const dto = {
        username: 'updatedUser',
        password: 'newPassword123',
        oldPassword: 'correctOldPassword',
      };
      const hashedPassword = 'hashed_password';

      repository.findOne?.mockResolvedValue(existingUser);

      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(true as never);
      const saltSpy = jest
        .spyOn(bcrypt, 'genSalt')
        .mockResolvedValue('salt' as never);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedPassword as never);

      repository.merge?.mockImplementation(
        (entity, changes) =>
          ({
            ...entity,
            ...changes,
          }) as UpdateUserDto,
      );
      repository.save?.mockImplementation((user) => Promise.resolve(user));

      await service.update(id, userId, dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'username', 'email', 'password', 'imagePublicId'],
      });

      expect(compareSpy).toHaveBeenCalledWith(
        'correctOldPassword',
        existingUser.password,
      );

      compareSpy.mockRestore();
      saltSpy.mockRestore();
      hashSpy.mockRestore();
    });

    it('should throw BadRequestException if password is provided but oldPassword is missing', async () => {
      const dto = { password: 'newPassword123' };

      repository.findOne?.mockResolvedValue(existingUser);

      await expect(service.update(id, userId, dto)).rejects.toThrow(
        new BadRequestException('Old password is incorrect'),
      );
    });

    it('should throw BadRequestException if oldPassword does not match stored password', async () => {
      const dto = { password: 'newPassword123', oldPassword: 'wrongPassword' };

      repository.findOne?.mockResolvedValue(existingUser);

      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValue(false as never);

      await expect(service.update(id, userId, dto)).rejects.toThrow(
        new BadRequestException('Old password is incorrect'),
      );

      expect(compareSpy).toHaveBeenCalled();
      compareSpy.mockRestore();
    });

    it('should allow updating if the "duplicate" found is the user itself', async () => {
      const dto = { username: 'oldName' };
      repository.findOneBy?.mockResolvedValue(existingUser);
      repository.findOne?.mockResolvedValue(existingUser);
      repository.merge?.mockImplementation(
        (entity: User, changes: Partial<User>): User =>
          ({
            ...entity,
            ...changes,
          }) as User,
      );
      repository.save?.mockImplementation((u) => Promise.resolve(u));

      const result = await service.update(id, id, dto);
      expect(result.username).toBe('oldName');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw DuplicatedResourceException if new username belongs to someone else', async () => {
      const dto = { username: 'someone_else' };
      repository.findOneBy?.mockResolvedValue(existingUser);
      repository.findOne?.mockResolvedValue({
        id: 2,
        username: 'someone_else',
      });

      await expect(service.update(id, id, dto)).rejects.toThrow(
        DuplicatedResourceException,
      );
    });

    it('should delete image from Cloudinary and set imagePublicId to null when imagePath is "Delete"', async () => {
      const dto: UpdateUserDto = { imagePath: 'Delete' };

      repository.findOne?.mockResolvedValue(existingUser);
      mockCloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });

      repository.merge?.mockImplementation(
        (entity, changes) =>
          ({
            ...entity,
            ...changes,
          }) as UpdateUserDto,
      );
      repository.save?.mockImplementation((user) => Promise.resolve(user));

      await service.update(id, userId, dto);

      expect(mockCloudinaryService.deleteImage).toHaveBeenCalledWith(
        'old_public_id',
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          imagePublicId: null,
          imagePath: expect.stringContaining('ui-avatars.com') as string,
        }),
      );
    });

    it('should set imagePublicId to null before calling updateDtoImage when a file is provided', async () => {
      const dto: UpdateUserDto = { username: 'newName' };
      const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;

      repository.findOne?.mockResolvedValue(existingUser);
      mockCloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });

      const updatedDtoFromCloudinary = {
        ...dto,
        imagePublicId: 'brand_new_id',
        imagePath: 'http://new-path.com',
      };
      mockCloudinaryService.updateDtoImage.mockResolvedValue(
        updatedDtoFromCloudinary,
      );

      repository.merge?.mockImplementation(
        (entity, changes) =>
          ({
            ...entity,
            ...changes,
          }) as UpdateUserDto,
      );

      repository.save?.mockImplementation((user) => Promise.resolve(user));

      await service.update(id, userId, dto, mockFile);

      expect(mockCloudinaryService.deleteImage).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          imagePublicId: 'brand_new_id',
        }),
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user if email exists', async () => {
      const mockUser = { id: 1, email: 'test@tfg.com' } as User;
      repository.findOne?.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@tfg.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@tfg.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByResetToken', () => {
    it('should return a user if resetToken is valid', async () => {
      const mockUser = { id: 1, resetToken: 'valid-token' } as User;
      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.findByResetToken('valid-token');

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(result).toEqual(mockUser);
    });

    it('should throw ResourceNotFoundException if no user has that resetToken', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findByResetToken('invalid-token')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('updateResetToken', () => {
    it('should update the reset token and expiry date', async () => {
      const userId = 1;
      const token = 'new-secret-token';
      const mockUser = { id: 1, email: 'admin@watch.com' } as User;
      const mockUpdateResult = { affected: 1 };

      repository.findOne?.mockResolvedValue(mockUser);
      repository.update?.mockResolvedValue(mockUpdateResult);

      const result = await service.updateResetToken(userId, token);

      expect(repository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          resetToken: token,
          resetTokenExpires: expect.any(Date) as Date,
        }),
      );
      expect(result).toEqual(mockUpdateResult);
    });

    it('should throw ResourceNotFoundException if user does not exist', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.updateResetToken(1, 'token')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('updatePassword', () => {
    const userId = 1;
    const newPassword = 'newSecretPassword';
    const hashedPassword = 'new_hashed_password';
    const mockUser = {
      id: 1,
      username: 'testuser',
      password: 'old_password',
    } as User;

    it('should throw ResourceNotFoundException if user to update is not found', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.updatePassword(1, 'newPass')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });

    it('should hash the password and save the user using merge', async () => {
      const saltSpy = jest
        .spyOn(bcrypt, 'genSalt')
        .mockResolvedValue('salt' as never);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedPassword as never);

      repository.findOne?.mockResolvedValue(mockUser);

      repository.merge?.mockImplementation(
        (u: User, changes: Partial<User>) => ({
          ...u,
          ...changes,
        }),
      );
      repository.save?.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.updatePassword(userId, newPassword);

      expect(saltSpy).toHaveBeenCalledWith(10);
      expect(hashSpy).toHaveBeenCalledWith(newPassword, 'salt');
      expect(repository.save).toHaveBeenCalled();
      expect(result?.password).toBe(hashedPassword);

      saltSpy.mockRestore();
      hashSpy.mockRestore();
    });
  });

  describe('checkExistingUser', () => {
    const dto = { username: 'test', email: 'test@test.com' };

    it('should throw if username is taken by another user', async () => {
      repository.findOne?.mockResolvedValue({ id: 10, username: 'test' });
      await expect(service.checkExistingUser(dto, 5)).rejects.toThrow(
        DuplicatedResourceException,
      );
    });

    it('should NOT throw if username is taken by the same user (excludeUserId)', async () => {
      repository.findOne?.mockResolvedValue({ id: 5, username: 'test' });
      await expect(service.checkExistingUser(dto, 5)).resolves.not.toThrow();
    });

    it('should throw if email is taken by another user', async () => {
      repository.findOne?.mockResolvedValueOnce(null);
      repository.findOne?.mockResolvedValueOnce({
        id: 10,
        email: 'test@test.com',
      });
      await expect(service.checkExistingUser(dto, 5)).rejects.toThrow(
        DuplicatedResourceException,
      );
    });

    it('should not throw if both are unique', async () => {
      repository.findOne?.mockResolvedValue(null);
      await expect(service.checkExistingUser(dto)).resolves.not.toThrow();
    });
  });
});
