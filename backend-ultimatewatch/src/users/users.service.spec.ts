import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import * as bcrypt from 'bcrypt';
import { ObjectLiteral } from 'typeorm';

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
});
