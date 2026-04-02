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

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('MoviesService', () => {
  let service: MoviesService;
  let tmdbApiService: TmdbApiService;
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
    tmdbApiService = module.get<TmdbApiService>(TmdbApiService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMovieListForWholePage', () => {
    const mockMovies = [
      { id: 1, title: 'Movie 1' },
      { id: 2, title: 'Movie 2' },
      { id: 1, title: 'Movie 1 Duplicate' },
    ];

    it('should return the list from cache if it exists', async () => {
      const cachedData = [{ id: 10, title: 'Cached Movie' }];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getMovieListForWholePage(1);

      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockTmdbApiService.getMovieListFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should call TMDB 3 times and filter duplicates if cache is empty', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      mockTmdbApiService.getMovieListFromTmdb
        .mockResolvedValueOnce([mockMovies[0]])
        .mockResolvedValueOnce([mockMovies[1]])
        .mockResolvedValueOnce([mockMovies[2]]);

      const result = await service.getMovieListForWholePage(1);

      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockMovies[0], mockMovies[1]]);

      expect(cacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        result,
        600000,
      );
    });

    it('should correctly calculate TMDB pages based on the page parameter', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      mockTmdbApiService.getMovieListFromTmdb.mockResolvedValue([]);

      await service.getMovieListForWholePage(2);

      const spy = jest.spyOn(tmdbApiService, 'getMovieListFromTmdb');

      expect(spy).toHaveBeenNthCalledWith(1, 4, undefined, undefined);
      expect(spy).toHaveBeenNthCalledWith(2, 5, undefined, undefined);
      expect(spy).toHaveBeenNthCalledWith(3, 6, undefined, undefined);
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
      mockTmdbApiService.getMovieListFromTmdb.mockResolvedValue(mockMovies);

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
      mockTmdbApiService.getMovieListFromTmdb.mockResolvedValue([]);

      await service.getMovieListForWholePage(1, undefined, undefined);

      expect(cacheManager.get).toHaveBeenCalledWith(expectedCacheKey);
    });

    it('should propagate filters through fetchThreePages to TMDB API', async () => {
      const filters = { releaseYear: 2024 };
      const sort = 'revenue.desc';

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      const apiSpy = jest
        .spyOn(tmdbApiService, 'getMovieListFromTmdb')
        .mockResolvedValue([]);

      await service.getMovieListForWholePage(
        1,
        sort,
        filters as unknown as MediaFilterDto,
      );

      expect(apiSpy).toHaveBeenNthCalledWith(1, 1, sort, filters);
      expect(apiSpy).toHaveBeenNthCalledWith(2, 2, sort, filters);
      expect(apiSpy).toHaveBeenNthCalledWith(3, 3, sort, filters);
    });
  });

  describe('searchMoviesForWholePage', () => {
    const query = 'Inception';
    const mockMovies = [
      { id: 1, title: 'Inception' },
      { id: 2, title: 'Inception 2' },
      { id: 1, title: 'Inception Duplicate' },
    ];

    it('should return results from cache if available', async () => {
      const cachedData = [{ id: 100, title: 'Cached Search Result' }];
      const cacheKey = `search_movies_${query}_page_1`;

      const getSpy = jest
        .spyOn(cacheManager, 'get')
        .mockResolvedValue(cachedData);

      const result = await service.searchMoviesForWholePage(query, 1);

      expect(getSpy).toHaveBeenCalledWith(cacheKey);
      expect(mockTmdbApiService.searchMoviesFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should fetch from TMDB (3 pages) and save to cache if cache is empty', async () => {
      const cacheKey = `search_movies_${query}_page_1`;
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);

      mockTmdbApiService.searchMoviesFromTmdb
        .mockResolvedValueOnce([mockMovies[0]])
        .mockResolvedValueOnce([mockMovies[1]])
        .mockResolvedValueOnce([mockMovies[2]]);

      const setSpy = jest.spyOn(cacheManager, 'set');

      const result = await service.searchMoviesForWholePage(query, 1);

      expect(mockTmdbApiService.searchMoviesFromTmdb).toHaveBeenCalledTimes(3);

      expect(result).toHaveLength(2);
      expect(result).toEqual([mockMovies[0], mockMovies[1]]);

      expect(setSpy).toHaveBeenCalledWith(cacheKey, result, 600000);
    });

    it('should call TMDB with correct calculated pages when page > 1', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      const searchSpy = jest
        .spyOn(tmdbApiService, 'searchMoviesFromTmdb')
        .mockResolvedValue([]);

      await service.searchMoviesForWholePage(query, 2);

      expect(searchSpy).toHaveBeenNthCalledWith(1, query, 4);
      expect(searchSpy).toHaveBeenNthCalledWith(2, query, 5);
      expect(searchSpy).toHaveBeenNthCalledWith(3, query, 6);
    });

    it('should default to page 1 if no page is provided', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      const searchSpy = jest
        .spyOn(tmdbApiService, 'searchMoviesFromTmdb')
        .mockResolvedValue([]);

      await service.searchMoviesForWholePage(query);

      expect(searchSpy).toHaveBeenNthCalledWith(1, query, 1);
    });

    it('should propagate errors from TMDB API', async () => {
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      jest
        .spyOn(tmdbApiService, 'searchMoviesFromTmdb')
        .mockRejectedValue(new Error('Search Failed'));

      await expect(service.searchMoviesForWholePage(query, 1)).rejects.toThrow(
        'Search Failed',
      );
    });
  });
});
