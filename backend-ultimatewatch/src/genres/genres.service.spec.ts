import { Test, TestingModule } from '@nestjs/testing';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { MediaType } from 'src/common/enums/media.type.enum';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('GenresService', () => {
  let service: GenresService;
  let genreRepo: MockRepository<Genre>;

  const mockTmdbApiService = {
    getMediaGenres: jest.fn(),
  };

  const createMockRepository = (): MockRepository<Genre> => ({
    upsert: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: getRepositoryToken(Genre),
          useValue: createMockRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
    genreRepo = module.get(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('storeTmdbGenres', () => {
    it('should fetch genres from TMDB and upsert them', async () => {
      const mockMovieGenres = [{ id: 1, name: 'Action' }];
      const mockSeriesGenres = [{ id: 2, name: 'Drama' }];

      mockTmdbApiService.getMediaGenres
        .mockResolvedValueOnce(mockMovieGenres)
        .mockResolvedValueOnce(mockSeriesGenres);

      const result = await service.storeTmdbGenres();

      expect(result).toBe(2);
      expect(mockTmdbApiService.getMediaGenres).toHaveBeenCalledTimes(2);
      expect(genreRepo.upsert).toHaveBeenCalled();
    });

    it('should not call upsert if no genres are returned', async () => {
      mockTmdbApiService.getMediaGenres.mockResolvedValue([]);

      const result = await service.storeTmdbGenres();

      expect(result).toBe(0);
      expect(genreRepo.upsert).not.toHaveBeenCalled();
    });
  });

  describe('findByTmdbId', () => {
    it('should return a genre if found', async () => {
      const mockGenre = { tmdbId: 1, name: 'Action' } as Genre;
      genreRepo.findOne?.mockResolvedValue(mockGenre);

      const result = await service.findByTmdbId(1);

      expect(result).toEqual(mockGenre);
      expect(genreRepo.findOne).toHaveBeenCalledWith({ where: { tmdbId: 1 } });
    });

    it('should throw ResourceNotFoundException if genre is not found', async () => {
      genreRepo.findOne?.mockResolvedValue(null);

      await expect(service.findByTmdbId(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findForMovies and findForSeries', () => {
    const mockGenres = [
      { tmdbId: 1, name: 'Action', mediaType: MediaType.MOVIE },
      { tmdbId: 2, name: 'Comedy', mediaType: MediaType.SERIES },
    ];

    it('findForMovies should return only movie genres', async () => {
      genreRepo.find?.mockResolvedValue([mockGenres[0]]);

      const result = await service.findForMovies();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Action');
      expect(genreRepo.find).toHaveBeenCalledWith({
        where: { mediaType: MediaType.MOVIE },
      });
    });

    it('findForSeries should return only series genres', async () => {
      genreRepo.find?.mockResolvedValue([mockGenres[1]]);

      const result = await service.findForSeries();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Comedy');
      expect(genreRepo.find).toHaveBeenCalledWith({
        where: { mediaType: MediaType.SERIES },
      });
    });
  });
});
