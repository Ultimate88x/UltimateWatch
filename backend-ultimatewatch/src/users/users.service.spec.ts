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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<MockRepository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashed_password',
      } as User;

      mockQueryBuilder.getOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    });

    it('should throw ResourceNotFoundException if user not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findByUsername('nonexistent')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should hash password and save user', async () => {
      const dto = {
        username: 'newuser',
        email: 'test@test.com',
        password: 'password123',
      };

      const savedUser = { ...dto, id: 1, password: 'hashed_password' };
      repository.save?.mockResolvedValue(savedUser);

      const bcryptSpy = jest.spyOn(bcrypt, 'hash') as jest.SpyInstance;

      bcryptSpy.mockImplementation(() => Promise.resolve('hashed_password'));

      const result = await service.create(dto);

      expect(bcryptSpy).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          username: dto.username,
          password: 'hashed_password',
        }),
      );
      expect(result).toEqual(savedUser);

      bcryptSpy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
      } as User;

      repository.findOne?.mockResolvedValue(mockUser);
      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ResourceNotFoundException if user is not found', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
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
      imagePublicId: 'old_public_id',
    } as User;

    it('should throw ResourceNotOwnedException if id does not match userId', async () => {
      await expect(service.update(1, 2, { username: 'new' })).rejects.toThrow(
        ResourceNotOwnedException,
      );
    });

    it('should throw ResourceNotFoundException if user to update does not exist', async () => {
      repository.findOneBy?.mockResolvedValue(null);

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

      repository.findOneBy?.mockResolvedValue(existingUser);
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

      repository.findOneBy?.mockResolvedValue(userWithoutImage);
      mockCloudinaryService.updateDtoImage.mockResolvedValue({
        ...dto,
        imagePath: 'url',
      });
      repository.save?.mockImplementation((user) => Promise.resolve(user));

      await service.update(id, userId, dto, mockFile);

      expect(mockCloudinaryService.deleteImage).not.toHaveBeenCalled();
      expect(mockCloudinaryService.updateDtoImage).toHaveBeenCalled();
    });

    it('should hash password and update user using merge when password is provided', async () => {
      const dto = { username: 'updatedUser', password: 'newPassword123' };
      const hashedPassword = 'hashed_password';

      repository.findOneBy?.mockResolvedValue(existingUser);
      repository.merge?.mockImplementation(
        (entity: User, changes: Partial<User>) => ({
          ...entity,
          ...changes,
        }),
      );
      repository.save?.mockImplementation((user) => Promise.resolve(user));

      const saltSpy = jest
        .spyOn(bcrypt, 'genSalt')
        .mockResolvedValue('salt' as never);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedPassword as never);

      const result = await service.update(id, userId, dto);

      expect(saltSpy).toHaveBeenCalledWith(10);
      expect(hashSpy).toHaveBeenCalledWith('newPassword123', 'salt');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
        }),
      );

      expect(result?.password).toBe(hashedPassword);

      saltSpy.mockRestore();
      hashSpy.mockRestore();
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

    it('should throw ResourceNotFoundException if email does not exist', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.findByEmail('notfound@test.com')).rejects.toThrow(
        ResourceNotFoundException,
      );
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
});
