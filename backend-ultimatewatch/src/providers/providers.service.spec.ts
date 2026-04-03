import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { MediaProvider } from './entities/media.provider.entity';
import { ObjectLiteral, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { WatchmodeService } from 'src/common/watchmode/watchmode.service';
import { MediaContentsService } from 'src/media-contents/media-contents.service';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { MediaType } from 'src/common/enums/media.type.enum';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ProvidersService', () => {
  let service: ProvidersService;

  const createMockProvidersRepository = (): MockRepository<Provider> => ({
    save: jest.fn(),
    findOne: jest.fn(),
    upsert: jest.fn(),
  });

  const createMockMediaProvidersRepository =
    (): MockRepository<MediaProvider> => ({
      save: jest.fn(),
      find: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    });

  const mockTmdbApiService = {
    getProvidersForMedia: jest.fn(),
  };
  const mockWatchmodeService = {
    getProvidersForMediaFromWatchmode: jest.fn(),
  };
  const mockMediaContentsService = {
    findByTmdbId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: getRepositoryToken(Provider),
          useValue: createMockProvidersRepository(),
        },
        {
          provide: getRepositoryToken(MediaProvider),
          useValue: createMockMediaProvidersRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
        {
          provide: WatchmodeService,
          useValue: mockWatchmodeService,
        },
        {
          provide: MediaContentsService,
          useValue: mockMediaContentsService,
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreate', () => {
    const providerData = { tmdbId: 10, name: 'Netflix' } as Provider;
    const mediaTmdbId = 500;

    it('should throw ResourceNotFoundException if mediaContent does not exist', async () => {
      mockMediaContentsService.findByTmdbId.mockResolvedValue(null);

      await expect(
        service.findOrCreate(mediaTmdbId, providerData),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('should upsert and return the provider if everything is correct', async () => {
      const mockMedia = { id: 1, tmdbId: mediaTmdbId };
      const providerRepo = service[
        'providerRepository'
      ] as unknown as MockRepository<Provider>;
      const mediaProviderRepo = service[
        'mediaProviderRepository'
      ] as unknown as MockRepository<MediaProvider>;

      providerRepo.findOne?.mockResolvedValue(providerData);
      mockMediaContentsService.findByTmdbId.mockResolvedValue(mockMedia);
      mediaProviderRepo.upsert?.mockResolvedValue(undefined);

      const result = await service.findOrCreate(mediaTmdbId, providerData);

      expect(providerRepo.upsert).toHaveBeenCalled();
      expect(result).toEqual(providerData);
    });
  });

  describe('findProvidersOrGetFromTmdbAndFindOrCreate', () => {
    it('should return local providers if they are NOT stale', async () => {
      const recentDate = new Date();
      const localProviders = [
        {
          provider: { tmdbId: 8, name: 'Netflix' },
          uniqueLastRetrieved: recentDate,
        },
      ];
      const mediaProviderRepo = service[
        'mediaProviderRepository'
      ] as unknown as MockRepository<MediaProvider>;
      mediaProviderRepo.find?.mockResolvedValue(localProviders);

      const result = await service.findProvidersOrGetFromTmdbAndFindOrCreate(
        123,
        MediaType.MOVIE,
      );

      expect(result).toHaveLength(1);
      expect(mockTmdbApiService.getProvidersForMedia).not.toHaveBeenCalled();
    });
  });

  describe('syncProviders', () => {
    it('should delete providers not present in the API response', async () => {
      const currentInDb = [
        { id: 100, provider: { tmdbId: 1 } },
        { id: 101, provider: { tmdbId: 2 } },
      ] as MediaProvider[];

      const fromApi = [{ tmdbId: 1 }] as Provider[];
      const mediaProviderRepo = service[
        'mediaProviderRepository'
      ] as unknown as MockRepository<MediaProvider>;

      mediaProviderRepo.find?.mockResolvedValue(currentInDb);

      await service.syncProviders(123, fromApi);

      expect(mediaProviderRepo.delete).toHaveBeenCalledWith([101]);
    });
  });

  describe('findProviderUrlForMediaAndProvider', () => {
    it('should return the link from query builder if found', async () => {
      const mediaProviderRepo = service[
        'mediaProviderRepository'
      ] as unknown as MockRepository<MediaProvider>;

      // Mock para el QueryBuilder complejo que usa tu servicio
      const mockQueryBuilder: any = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ link: 'https://test.com' }),
      };

      mediaProviderRepo.find?.mockResolvedValue([
        {
          lastLinkUpdate: new Date(),
          link: 'exists',
          mediaContent: { type: MediaType.MOVIE },
        },
      ]);
      mediaProviderRepo.createQueryBuilder?.mockReturnValue(mockQueryBuilder);

      const result = await service.findProviderUrlForMediaAndProvider(123, 10);

      expect(result).toBe('https://test.com');
    });
  });
});
