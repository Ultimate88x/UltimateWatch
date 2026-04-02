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

      // Usamos la instancia inyectada para definir el comportamiento
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedData);

      const result = await service.getMovieListForWholePage(1);

      // Verificamos sobre la instancia cacheManager
      expect(cacheManager.get).toHaveBeenCalled();
      expect(mockTmdbApiService.getMovieListFromTmdb).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should call TMDB 3 times and filter duplicates if cache is empty', async () => {
      // Configuramos el cacheManager para que devuelva null (miss)
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

      mockTmdbApiService.getMovieListFromTmdb
        .mockResolvedValueOnce([mockMovies[0]])
        .mockResolvedValueOnce([mockMovies[1]])
        .mockResolvedValueOnce([mockMovies[2]]);

      const result = await service.getMovieListForWholePage(1);

      expect(mockTmdbApiService.getMovieListFromTmdb).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockMovies[0], mockMovies[1]]);

      // Verificamos que se guarda en caché usando la instancia inyectada
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
  });
});
