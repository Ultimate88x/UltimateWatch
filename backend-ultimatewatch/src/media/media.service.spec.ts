import { Test, TestingModule } from '@nestjs/testing';
import { MediaContentsService } from './media.service';
import { Media } from './entities/media.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('MediaContentsService', () => {
  let service: MediaContentsService;
  let repository: MockRepository<Media>;

  const createMockRepository = (): MockRepository<Media> => ({
    findOne: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaContentsService,
        {
          provide: getRepositoryToken(Media),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MediaContentsService>(MediaContentsService);
    repository = module.get(getRepositoryToken(Media));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByTmdbId', () => {
    const tmdbId = 550;
    const mockMediaContent = {
      id: 1,
      tmdbId,
      title: 'Fight Club',
    } as Media;

    it('should return media content when found', async () => {
      repository.findOne?.mockResolvedValue(mockMediaContent);

      const result = await service.findByTmdbId(tmdbId);

      expect(result).toEqual(mockMediaContent);
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
