import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import * as bcrypt from 'bcrypt';
import { ObjectLiteral } from 'typeorm';
import { ResourceNotOwnedException } from 'src/common/exceptions/resource-not-owned-exception';

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
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
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

    it('should return null if user not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
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

    it('should return null if user is not found', async () => {
      repository.findOne?.mockResolvedValue(null);
      const result = await service.findOne(999);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete the user if the id matches the userId (Success)', async () => {
      const idToDelete = 1;
      const authenticatedUserId = 1;

      repository.delete?.mockResolvedValue({ affected: 1 });

      const result = await service.remove(idToDelete, authenticatedUserId);

      expect(result).toEqual({ message: 'Account deleted successfully' });
      expect(repository.delete).toHaveBeenCalledWith(idToDelete);
    });

    it('should throw ResourceNotOwnedException if id does not match userId (Failure)', async () => {
      const idToDelete = 5;
      const authenticatedUserId = 1;

      await expect(
        service.remove(idToDelete, authenticatedUserId),
      ).rejects.toThrow(ResourceNotOwnedException);

      expect(repository.delete).not.toHaveBeenCalled();
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
    } as User;

    it('should throw ResourceNotOwnedException if id does not match userId', async () => {
      await expect(service.update(1, 2, { username: 'new' })).rejects.toThrow(
        ResourceNotOwnedException,
      );
    });

    it('should return null if user is not found', async () => {
      const findOneBySpy = jest
        .spyOn(repository, 'findOneBy' as any)
        .mockResolvedValue(null);

      const result = await service.update(id, userId, { username: 'new' });

      expect(result).toBeNull();
      findOneBySpy.mockRestore();
    });

    it('should hash password and update user using merge when password is provided', async () => {
      const dto = { username: 'updatedUser', password: 'newPassword123' };
      const hashedPassword = 'hashed_password';

      const findOneBySpy = jest
        .spyOn(repository, 'findOneBy' as any)
        .mockResolvedValue(existingUser);
      const mergeSpy = jest
        .spyOn(repository, 'merge' as any)
        .mockImplementation((entity: User, changes: Partial<User>) => ({
          ...entity,
          ...changes,
        }));
      repository.save?.mockResolvedValue({
        ...existingUser,
        ...dto,
        password: hashedPassword,
      });

      const saltSpy = jest
        .spyOn(bcrypt, 'genSalt')
        .mockResolvedValue('salt' as never);
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedPassword as never);

      const result = await service.update(id, userId, dto);

      expect(saltSpy).toHaveBeenCalledWith(10);
      expect(hashSpy).toHaveBeenCalledWith('newPassword123', 'salt');

      expect(findOneBySpy).toHaveBeenCalledWith({ id });
      expect(mergeSpy).toHaveBeenCalledWith(
        existingUser,
        expect.objectContaining({
          password: hashedPassword,
        }),
      );
      expect(repository.save).toHaveBeenCalled();

      expect(result?.username).toBe(dto.username);
      expect(result?.password).toBe(hashedPassword);

      findOneBySpy.mockRestore();
      mergeSpy.mockRestore();
      saltSpy.mockRestore();
      hashSpy.mockRestore();
    });

    it('should update user without hashing when password is not provided', async () => {
      const dto = { username: 'onlyNameUpdate' };

      const findOneBySpy = jest
        .spyOn(repository, 'findOneBy' as any)
        .mockResolvedValue(existingUser);
      const mergeSpy = jest
        .spyOn(repository, 'merge' as any)
        .mockImplementation((entity: User, changes: Partial<User>) => ({
          ...entity,
          ...changes,
        }));
      repository.save?.mockResolvedValue({ ...existingUser, ...dto });

      const hashSpy = jest.spyOn(bcrypt, 'hash');

      const result = await service.update(id, userId, dto);

      expect(hashSpy).not.toHaveBeenCalled();
      expect(repository.findOneBy).toHaveBeenCalledWith({ id });
      expect(repository.save).toHaveBeenCalled();
      expect(result?.username).toBe(dto.username);

      findOneBySpy.mockRestore();
      mergeSpy.mockRestore();
      hashSpy.mockRestore();
    });
  });
});
