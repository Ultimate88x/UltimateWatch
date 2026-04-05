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
import { TmdbSeriesDto } from 'src/common/tmdbapi/dto/media/tmdb-series-dto';
import { SeriesDetailDto } from './dto/series-detail-dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('SeriesService', () => {
  let service: SeriesService;
  let cacheManager: Cache;
  let seriesRepositoryMock: MockRepository<Series>;

  const createMockRepository = (): MockRepository<Series> => ({
    save: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
  });

  const mockTmdbApiService = {
    getSeriesListFromTmdb: jest.fn(),
    searchSeriesFromTmdb: jest.fn(),
    getSeriesFromTmdb: jest.fn(),
  };
  const mockGenresService = {
    findByTmdbId: jest.fn(),
  };
  const mockProductionCompaniesService = {
    upsert: jest.fn(),
  };
  const mockSeasonsService = {
    upsert: jest.fn(),
  };
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    seriesRepositoryMock = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: getRepositoryToken(Series),
          useValue: seriesRepositoryMock,
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

  describe('create', () => {
    it('should map DTO and save to DB twice', async () => {
      const tmdbDto = {
        id: 123,
        name: 'New Series',
        genres: [{ id: 1 }],
        production_companies: [],
        seasons: [{ season_number: 1 }],
      } as unknown as TmdbSeriesDto;

      const mockSavedSeries = {
        id: 1,
        seasons: [{ number: 1 }],
        media: { genres: [], productionCompanies: [] },
      } as unknown as Series;

      mockGenresService.findByTmdbId.mockResolvedValue({
        id: 1,
        name: 'Action',
      });
      mockProductionCompaniesService.upsert.mockImplementation((pc) =>
        Promise.resolve(pc),
      );
      mockSeasonsService.upsert.mockImplementation((s) => Promise.resolve(s));

      seriesRepositoryMock.save?.mockResolvedValueOnce(mockSavedSeries);
      seriesRepositoryMock.save?.mockResolvedValueOnce(mockSavedSeries);

      const result = await service.create(tmdbDto);

      expect(mockGenresService.findByTmdbId).toHaveBeenCalled();
      expect(seriesRepositoryMock.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSavedSeries);
    });
  });

  describe('update', () => {
    it('should merge new data into existing series', async () => {
      const existingSeries = {
        id: 1,
        genres: [],
        productionCompanies: [],
        seasons: [],
      } as unknown as Series;

      const tmdbDto = {
        name: 'Updated',
        genres: [],
        production_companies: [],
        seasons: [],
      } as unknown as TmdbSeriesDto;

      mockGenresService.findByTmdbId.mockResolvedValue({});
      mockProductionCompaniesService.upsert.mockResolvedValue({});
      mockSeasonsService.upsert.mockResolvedValue({});
      seriesRepositoryMock.save?.mockResolvedValue(existingSeries);

      await service.update(existingSeries, tmdbDto);

      expect(seriesRepositoryMock.merge).toHaveBeenCalled();
      expect(seriesRepositoryMock.save).toHaveBeenCalledWith(existingSeries);
    });
  });

  describe('findSeriesFromTmdbId', () => {
    const tmdbId = 123;

    it('should return from DB if data is fresh', async () => {
      const freshSeries = {
        tmdbId,
        updatedAt: new Date(),
        genres: [],
        productionCompanies: [],
        seasons: [],
        getSeasonsNumber: () => 0,
      } as unknown as Series;

      seriesRepositoryMock.findOne?.mockResolvedValue(freshSeries);

      const result = await service.findSeriesFromTmdbId(tmdbId);

      expect(result.tmdbId).toBe(tmdbId);
      expect(mockTmdbApiService.getSeriesListFromTmdb).not.toHaveBeenCalled();
    });

    it('should update if data is stale', async () => {
      const staleDate = new Date();
      staleDate.setDate(staleDate.getDate() - 10);

      const staleSeries = {
        media: { tmdbId, updatedAt: staleDate },
      } as unknown as Series;

      const updatedSeries = {
        tmdbId,
        genres: [],
        productionCompanies: [],
        seasons: [],
        getSeasonsNumber: () => 0,
      } as unknown as Series;

      seriesRepositoryMock.findOne?.mockResolvedValue(staleSeries);
      mockTmdbApiService.getSeriesFromTmdb.mockResolvedValue({
        id: tmdbId,
      } as any);

      const updateSpy = jest
        .spyOn(service, 'update')
        .mockResolvedValue(updatedSeries);

      await service.findSeriesFromTmdbId(tmdbId);

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('createSeriesDetailDto (private)', () => {
    it('should correctly format dates into ISO strings', () => {
      const series = {
        tmdbId: 1,
        title: 'Test',
        genres: [{ name: 'Action' }],
        productionCompanies: [{ name: 'HBO', logoPath: '/hbo.png' }],
        releaseDate: new Date('2020-01-01'),
        lastAirDate: new Date('2022-01-01'),
        seasons: [{ title: 'S1', number: 1 }],
        getSeasonsNumber: () => 1,
      } as unknown as Series;

      type PrivateMethodCaller = {
        createSeriesDetailDto: (s: Series) => SeriesDetailDto;
      };

      const serviceAsPrivate = service as unknown as PrivateMethodCaller;

      const result = serviceAsPrivate.createSeriesDetailDto(series);

      expect(result.releaseDate).toBe(new Date('2020-01-01').toISOString());
      expect(result.lastAirDate).toBe(new Date('2022-01-01').toISOString());
    });
  });
});
