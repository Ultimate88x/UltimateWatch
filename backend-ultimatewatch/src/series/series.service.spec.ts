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
import { MediaListDto } from 'src/common/dto/media-list-dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('SeriesService', () => {
  let service: SeriesService;
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
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSeriesListForWholePage', () => {
    const mockTmdbResponse = (results: any[]) => ({
      mediaList: results,
      totalPages: 100,
    });

    it('should return the list from cache if it exists', async () => {
      const cachedData = new MediaListDto({
        mediaList: [{ id: 10, name: 'Cached Series' }] as any[],
        lastPage: false,
      });

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getSeriesListForWholePage(1);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockTmdbApiService.getSeriesListFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should call TMDB 3 times and filter duplicates if cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      mockTmdbApiService.getSeriesListFromTmdb
        .mockResolvedValueOnce(mockTmdbResponse([{ id: 1, name: 'Series 1' }]))
        .mockResolvedValueOnce(mockTmdbResponse([{ id: 2, name: 'Series 2' }]))
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 1, name: 'Series 1 Duplicate' }]),
        );

      const result = await service.getSeriesListForWholePage(1);

      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenCalledTimes(3);
      expect(result.mediaList).toHaveLength(2);
      expect(result.mediaList[0].id).toBe(1);
      expect(result.mediaList[1].id).toBe(2);

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        result,
        600000,
      );
    });

    it('should correctly calculate TMDB pages based on the page parameter', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getSeriesListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.getSeriesListForWholePage(2);

      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenNthCalledWith(
        1,
        4,
        undefined,
        undefined,
      );
      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenNthCalledWith(
        2,
        5,
        undefined,
        undefined,
      );
      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenNthCalledWith(
        3,
        6,
        undefined,
        undefined,
      );
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
      mockTmdbApiService.getSeriesListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

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
      mockTmdbApiService.getSeriesListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.getSeriesListForWholePage(1, undefined, undefined);

      expect(cacheManager.get).toHaveBeenCalledWith(expectedCacheKey);
    });

    it('should pass filters to all 3 pages fetched via fetchThreePages', async () => {
      const filters = { releaseYear: 2024 };
      const sort = 'popularity.desc';

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getSeriesListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.getSeriesListForWholePage(
        1,
        sort,
        filters as unknown as MediaFilterDto,
      );

      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenCalledTimes(3);
      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenNthCalledWith(
        1,
        1,
        sort,
        filters,
      );
      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenNthCalledWith(
        2,
        2,
        sort,
        filters,
      );
      expect(mockTmdbApiService.getSeriesListFromTmdb).toHaveBeenNthCalledWith(
        3,
        3,
        sort,
        filters,
      );
    });
  });

  describe('searchSeriesForWholePage', () => {
    const query = 'Breaking Bad';
    const mockTmdbResponse = (results: any[]) => ({
      mediaList: results,
      totalPages: 10,
    });

    it('should return series list from cache if it exists', async () => {
      const cachedData = new MediaListDto({
        mediaList: [{ id: 999, name: 'Cached TV Show' }] as any[],
        lastPage: false,
      });
      const cacheKey = `search_series_${query}_page_1`;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.searchSeriesForWholePage(query, 1);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockTmdbApiService.searchSeriesFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch from TMDB, filter duplicates and save to cache if empty', async () => {
      const cacheKey = `search_series_${query}_page_1`;
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);

      mockTmdbApiService.searchSeriesFromTmdb
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 101, name: 'Breaking Bad' }]),
        )
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 102, name: 'Better Call Saul' }]),
        )
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 101, name: 'Duplicate' }]),
        );

      const result = await service.searchSeriesForWholePage(query, 1);

      expect(mockTmdbApiService.searchSeriesFromTmdb).toHaveBeenCalledTimes(3);
      expect(result.mediaList).toHaveLength(2);
      expect(result.mediaList[0].id).toBe(101);
      expect(result.mediaList[1].id).toBe(102);

      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, result, 600000);
    });

    it('should calculate correct TMDB pages when requesting page 2', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      mockTmdbApiService.searchSeriesFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.searchSeriesForWholePage(query, 2);

      expect(mockTmdbApiService.searchSeriesFromTmdb).toHaveBeenNthCalledWith(
        1,
        query,
        4,
      );
      expect(mockTmdbApiService.searchSeriesFromTmdb).toHaveBeenNthCalledWith(
        2,
        query,
        5,
      );
      expect(mockTmdbApiService.searchSeriesFromTmdb).toHaveBeenNthCalledWith(
        3,
        query,
        6,
      );
    });

    it('should handle errors from TMDB API during series search', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      mockTmdbApiService.searchSeriesFromTmdb.mockRejectedValue(
        new Error('TMDB Search Series Error'),
      );

      await expect(service.searchSeriesForWholePage(query, 1)).rejects.toThrow(
        'TMDB Search Series Error',
      );
    });
  });
});
