import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('SeedService', () => {
  let service: SeedService;

  const mockUserRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runSeed', () => {
    it('should truncate the table and create the admin user', async () => {
      mockUserRepository.query.mockResolvedValue(undefined);

      const mockUserData = { id: 1, username: 'admin' };
      mockUserRepository.create.mockReturnValue(mockUserData);
      mockUserRepository.save.mockResolvedValue(mockUserData);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.runSeed();

      expect(mockUserRepository.query).toHaveBeenCalledWith(
        'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          username: 'admin',
        }),
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUserData);
    });
  });

  describe('onApplicationBootstrap', () => {
    it('should call runSeed on bootstrap', async () => {
      const runSeedSpy = jest
        .spyOn(service as any, 'runSeed')
        .mockResolvedValue(undefined);

      await service.onApplicationBootstrap();

      expect(runSeedSpy).toHaveBeenCalled();
    });
  });
});
