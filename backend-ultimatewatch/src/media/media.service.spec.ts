import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { Media } from './entities/media.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('MediaService', () => {
  let service: MediaService;
  let repository: MockRepository<Media>;

  const createMockRepository = (): MockRepository<Media> => ({
    findOne: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    repository = module.get(getRepositoryToken(Media));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByTmdbId', () => {
    const tmdbId = 550;
    const mockmedia = {
      id: 1,
      tmdbId,
      title: 'Fight Club',
    } as Media;

    it('should return media content when found', async () => {
      repository.findOne?.mockResolvedValue(mockmedia);

      const result = await service.findByTmdbId(tmdbId);

      expect(result).toEqual(mockmedia);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tmdbId },
      });
    });

    it('should throw ResourceNotFoundException when media content is not found', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.findByTmdbId(tmdbId)).rejects.toThrow(
        ResourceNotFoundException,
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tmdbId },
      });
    });
  });
});
