import { Test, TestingModule } from '@nestjs/testing';
import { SeriesService } from './series.service';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Series } from './entities/series.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { SeasonService } from 'src/seasons/seasons.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('SeriesService', () => {
  let service: SeriesService;
  let tmdbApiService: TmdbApiService;
  let cacheManager: Cache;

  const createMockRepository = (): MockRepository<Series> => ({});

  const mockTmdbApiService = {
    getSeriesListFromTmdb: jest.fn(),
  };
  const mockGenresService = {};
  const mockProductionCompaniesService = {};
  const mockSeasonsService = {};
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: getRepositoryToken(Series),
          useValue: createMockRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
        {
          provide: GenresService,
          useValue: mockGenresService,
        },
        {
          provide: ProductionCompaniesService,
          useValue: mockProductionCompaniesService,
        },
        {
          provide: SeasonService,
          useValue: mockSeasonsService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<SeriesService>(SeriesService);
    tmdbApiService = module.get<TmdbApiService>(TmdbApiService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSeriesListForWholePage', () => {
    const mockSeries = [
      { id: 1, name: 'Series 1' },
      { id: 2, name: 'Series 2' },
      { id: 1, name: 'Series 1 Duplicate' },
    ];

    it('should return the list from cache if it exists', async () => {
      const cachedData = [{ id: 10, name: 'Cached Series' }];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getSeriesListForWholePage(1);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockTmdbApiService.getSeriesListFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should call TMDB 3 times and filter duplicates if cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      mockTmdbApiService.getSeriesListFromTmdb
        .mockResolvedValueOnce([mockSeries[0]])
        .mockResolvedValueOnce([mockSeries[1]])
        .mockResolvedValueOnce([mockSeries[2]]);

      const result = await service.getSeriesListForWholePage(1);

      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockSeries[0], mockSeries[1]]);

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        result,
        600000,
      );
    });

    it('should correctly calculate TMDB pages based on the page parameter', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getSeriesListFromTmdb.mockResolvedValue([]);

      // Formula: (2 - 1) * 3 + 1 = 4
      await service.getSeriesListForWholePage(2);

      const spy = jest.spyOn(tmdbApiService, 'getSeriesListFromTmdb');

      expect(spy).toHaveBeenNthCalledWith(1, 4, undefined, undefined);
      expect(spy).toHaveBeenNthCalledWith(2, 5, undefined, undefined);
      expect(spy).toHaveBeenNthCalledWith(3, 6, undefined, undefined);
    });

    it('should handle errors if TMDB fails', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getSeriesListFromTmdb.mockRejectedValue(
        new Error('TMDB Error'),
      );

      await expect(service.getSeriesListForWholePage(1)).rejects.toThrow(
        'TMDB Error',
      );
    });
  });
});
