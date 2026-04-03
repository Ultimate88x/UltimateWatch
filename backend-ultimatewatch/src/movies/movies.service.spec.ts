/* eslint-disable @typescript-eslint/no-base-to-string */
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Movie } from './entities/movie.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('MoviesService', () => {
  let service: MoviesService;
  let cacheManager: Cache;

  const createMockRepository = (): MockRepository<Movie> => ({});

  const mockTmdbApiService = {
    getMovieListFromTmdb: jest.fn(),
    searchMoviesFromTmdb: jest.fn(),
  };
  const mockGenresService = {};
  const mockProductionCompaniesService = {};
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
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
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMovieListForWholePage', () => {
    const mockTmdbResponse = (results: any[]) => ({
      mediaList: results,
      totalPages: 100,
    });

    it('should return the list from cache if it exists', async () => {
      const cachedData = new MediaListDto({
        mediaList: [{ id: 10, title: 'Cached Movie' }] as any[],
        lastPage: false,
      });

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getMovieListForWholePage(1);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockTmdbApiService.getMovieListFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should call TMDB 3 times and filter duplicates if cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      mockTmdbApiService.getMovieListFromTmdb
        .mockResolvedValueOnce(mockTmdbResponse([{ id: 1, title: 'Movie 1' }]))
        .mockResolvedValueOnce(mockTmdbResponse([{ id: 2, title: 'Movie 2' }]))
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 1, title: 'Movie 1 Duplicate' }]),
        );

      const result = await service.getMovieListForWholePage(1);

      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenCalledTimes(3);
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
      mockTmdbApiService.getMovieListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.getMovieListForWholePage(2);

      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenNthCalledWith(
        1,
        4,
        undefined,
        undefined,
      );
      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenNthCalledWith(
        2,
        5,
        undefined,
        undefined,
      );
      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenNthCalledWith(
        3,
        6,
        undefined,
        undefined,
      );
    });

    it('should handle errors if TMDB fails', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getMovieListFromTmdb.mockRejectedValue(
        new Error('TMDB Error'),
      );

      await expect(service.getMovieListForWholePage(1)).rejects.toThrow(
        'TMDB Error',
      );
    });

    it('should include filters in the cache key', async () => {
      const filters = { withGenres: '28' };
      const expectedCacheKey = `movies_page_1_popularity.desc_${filters.toString()}`;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getMovieListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.getMovieListForWholePage(
        1,
        'popularity.desc',
        filters as unknown as MediaFilterDto,
      );

      expect(cacheManager.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenCalledWith(
        expect.any(Number),
        'popularity.desc',
        filters,
      );
    });

    it('should handle undefined filters in cache key correctly', async () => {
      const expectedCacheKey = `movies_page_1_undefined_undefined`;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getMovieListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.getMovieListForWholePage(1, undefined, undefined);

      expect(cacheManager.get).toHaveBeenCalledWith(expectedCacheKey);
    });

    it('should propagate filters through fetchThreePages to TMDB API', async () => {
      const filters = { releaseYear: 2024 };
      const sort = 'revenue.desc';

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getMovieListFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.getMovieListForWholePage(
        1,
        sort,
        filters as unknown as MediaFilterDto,
      );

      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenNthCalledWith(
        1,
        1,
        sort,
        filters,
      );
      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenNthCalledWith(
        2,
        2,
        sort,
        filters,
      );
      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenNthCalledWith(
        3,
        3,
        sort,
        filters,
      );
    });
  });

  describe('searchMoviesForWholePage', () => {
    const query = 'Inception';
    const mockTmdbResponse = (results: any[]) => ({
      mediaList: results,
      totalPages: 10,
    });

    it('should return results from cache if available', async () => {
      const cachedData = new MediaListDto({
        mediaList: [] as any[],
        lastPage: false,
      });
      const cacheKey = `search_movies_${query}_page_1`;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.searchMoviesForWholePage(query, 1);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockTmdbApiService.searchMoviesFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch from TMDB (3 pages) and save to cache if cache is empty', async () => {
      const cacheKey = `search_movies_${query}_page_1`;
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);

      mockTmdbApiService.searchMoviesFromTmdb
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 1, title: 'Inception' }]),
        )
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 2, title: 'Inception 2' }]),
        )
        .mockResolvedValueOnce(
          mockTmdbResponse([{ id: 1, title: 'Duplicate' }]),
        );

      const result = await service.searchMoviesForWholePage(query, 1);

      expect(mockTmdbApiService.searchMoviesFromTmdb).toHaveBeenCalledTimes(3);
      expect(result.mediaList).toHaveLength(2);
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, result, 600000);
    });

    it('should call TMDB with correct calculated pages when page > 1', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      mockTmdbApiService.searchMoviesFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.searchMoviesForWholePage(query, 2);

      expect(mockTmdbApiService.searchMoviesFromTmdb).toHaveBeenNthCalledWith(
        1,
        query,
        4,
      );
      expect(mockTmdbApiService.searchMoviesFromTmdb).toHaveBeenNthCalledWith(
        2,
        query,
        5,
      );
      expect(mockTmdbApiService.searchMoviesFromTmdb).toHaveBeenNthCalledWith(
        3,
        query,
        6,
      );
    });

    it('should default to page 1 if no page is provided', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      mockTmdbApiService.searchMoviesFromTmdb.mockResolvedValue(
        mockTmdbResponse([]),
      );

      await service.searchMoviesForWholePage(query);

      expect(mockTmdbApiService.searchMoviesFromTmdb).toHaveBeenNthCalledWith(
        1,
        query,
        1,
      );
    });

    it('should propagate errors from TMDB API', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      mockTmdbApiService.searchMoviesFromTmdb.mockRejectedValue(
        new Error('Search Failed'),
      );

      await expect(service.searchMoviesForWholePage(query, 1)).rejects.toThrow(
        'Search Failed',
      );
    });
  });
});
