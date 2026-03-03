/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runSeed', () => {
    it('should not seed if users already exist', async () => {
      mockUserRepository.count.mockResolvedValue(1);

      await service.runSeed();

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should seed admin user if database is empty', async () => {
      mockUserRepository.count.mockResolvedValue(0);

      const mockUserData = { username: 'admin', email: 'admin@watch.com' };
      mockUserRepository.create.mockReturnValue(mockUserData);
      mockUserRepository.save.mockResolvedValue(mockUserData);

      jest
        .spyOn(bcrypt, 'hash' as never)
        .mockImplementation(() => Promise.resolve('hashedPassword' as never));

      await service.runSeed();

      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
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
