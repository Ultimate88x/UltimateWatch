/* eslint-disable @typescript-eslint/no-base-to-string */
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
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';

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
    searchSeriesFromTmdb: jest.fn(),
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

    it('should include filters and sort in the cache key', async () => {
      const filters = { withGenres: '18,80' };
      const sort = 'first_air_date.desc';
      const page = 1;

      const expectedCacheKey = `series_page_${page}_${sort}_${filters.toString()}`;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getSeriesListFromTmdb.mockResolvedValue(mockSeries);

      await service.getSeriesListForWholePage(
        page,
        sort,
        filters as unknown as MediaFilterDto,
      );

      expect(cacheManager.get).toHaveBeenCalledWith(expectedCacheKey);

      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenCalledWith(
        expect.any(Number),
        sort,
        filters,
      );
    });

    it('should correctly handle the cache key when sort and filters are undefined', async () => {
      const expectedCacheKey = `series_page_1_undefined_undefined`;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getSeriesListFromTmdb.mockResolvedValue([]);

      await service.getSeriesListForWholePage(1, undefined, undefined);

      expect(cacheManager.get).toHaveBeenCalledWith(expectedCacheKey);
    });

    it('should pass filters to all 3 pages fetched via fetchThreePages', async () => {
      const filters = { releaseYear: 2024 };
      const sort = 'popularity.desc';

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      const apiSpy = jest
        .spyOn(tmdbApiService, 'getSeriesListFromTmdb')
        .mockResolvedValue([]);

      await service.getSeriesListForWholePage(
        1,
        sort,
        filters as unknown as MediaFilterDto,
      );

      expect(apiSpy).toHaveBeenCalledTimes(3);
      expect(apiSpy).toHaveBeenNthCalledWith(1, 1, sort, filters);
      expect(apiSpy).toHaveBeenNthCalledWith(2, 2, sort, filters);
      expect(apiSpy).toHaveBeenNthCalledWith(3, 3, sort, filters);
    });

    it('should return the cached list and NOT call TMDB if cache hit occurs with filters', async () => {
      const filters = { with_origin_country: 'ES' };
      const cachedData = [{ id: 50, name: 'La Casa de Papel' }];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getSeriesListForWholePage(
        1,
        'popularity.desc',
        filters as unknown as MediaFilterDto,
      );

      expect(result).toEqual(cachedData);
      expect(mockTmdbApiService.getSeriesListFromTmdb).not.toHaveBeenCalled();
    });
  });

  describe('searchSeriesForWholePage', () => {
    const query = 'Breaking Bad';
    const mockSeries = [
      { id: 101, name: 'Breaking Bad' },
      { id: 102, name: 'Better Call Saul' },
      { id: 101, name: 'Breaking Bad Duplicate' },
    ];

    it('should return series list from cache if it exists', async () => {
      const cachedData = [{ id: 999, name: 'Cached TV Show' }];
      const cacheKey = `search_series_${query}_page_1`;

      const getSpy = jest
        .spyOn(cacheManager, 'get')
        .mockResolvedValue(cachedData);

      const result = await service.searchSeriesForWholePage(query, 1);

      expect(getSpy).toHaveBeenCalledWith(cacheKey);
      expect(mockTmdbApiService.searchSeriesFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch from TMDB, filter duplicates and save to cache if empty', async () => {
      const cacheKey = `search_series_${query}_page_1`;
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);

      mockTmdbApiService.searchSeriesFromTmdb
        .mockResolvedValueOnce([mockSeries[0]])
        .mockResolvedValueOnce([mockSeries[1]])
        .mockResolvedValueOnce([mockSeries[2]]);

      const setSpy = jest.spyOn(cacheManager, 'set');

      const result = await service.searchSeriesForWholePage(query, 1);

      expect(mockTmdbApiService.searchSeriesFromTmdb).toHaveBeenCalledTimes(3);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(101);
      expect(result[1].id).toBe(102);

      expect(setSpy).toHaveBeenCalledWith(cacheKey, result, 600000);
    });

    it('should calculate correct TMDB pages when requesting page 2', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      const searchSpy = jest
        .spyOn(tmdbApiService, 'searchSeriesFromTmdb')
        .mockResolvedValue([]);

      await service.searchSeriesForWholePage(query, 2);

      expect(searchSpy).toHaveBeenNthCalledWith(1, query, 4);
      expect(searchSpy).toHaveBeenNthCalledWith(2, query, 5);
      expect(searchSpy).toHaveBeenNthCalledWith(3, query, 6);
    });

    it('should handle errors from TMDB API during series search', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      jest
        .spyOn(tmdbApiService, 'searchSeriesFromTmdb')
        .mockRejectedValue(new Error('TMDB Search Series Error'));

      await expect(service.searchSeriesForWholePage(query, 1)).rejects.toThrow(
        'TMDB Search Series Error',
      );
    });
  });
});
