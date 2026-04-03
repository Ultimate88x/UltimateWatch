import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { HttpModule } from '@nestjs/axios';
import { ProvidersService } from 'src/providers/providers.service';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';
import { BadRequestException } from '@nestjs/common';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { MediaType } from 'src/common/enums/media.type.enum';
import { MovieDetailDto } from './dto/movie-detail-dto';
import { ProviderListItemDto } from 'src/providers/dto/provider-list-item-dto';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;
  let providersService: ProvidersService;

  const mockMovieService = {
    getMovieListForWholePage: jest.fn(),
    searchMoviesForWholePage: jest.fn(),
    findMovieFromTmdbId: jest.fn(),
  };

  const mockProvidersService = {
    findProvidersOrGetFromTmdbAndFindOrCreate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMovieService,
        },
        {
          provide: ProvidersService,
          useValue: mockProvidersService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
    providersService = module.get<ProvidersService>(ProvidersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTmdbMovies', () => {
    const mockMediaListResponse: MediaListDto = {
      mediaList: [
        {
          id: 1,
          title: 'Test Movie 1',
          posterPath: '/path1.jpg',
          releaseDate: '2024-01-01',
        } as TmdbListMediaDto,
      ],
      lastPage: false,
    };

    it('should return a MediaListDto from the service', async () => {
      const filters = { page: '1', sort: 'popularity.desc' };

      (service.getMovieListForWholePage as jest.Mock).mockResolvedValue(
        mockMediaListResponse,
      );

      const result = await controller.getTmdbMovies(
        filters as unknown as MediaFilterDto,
      );

      expect(mockMovieService.getMovieListForWholePage).toHaveBeenCalledWith(
        1,
        filters.sort,
        filters,
      );
      expect(result).toEqual(mockMediaListResponse);
    });

    it('should use default page 1 if no page is provided', async () => {
      const filters = { sort: 'vote_average.desc' };
      (service.getMovieListForWholePage as jest.Mock).mockResolvedValue({
        mediaList: [],
        lastPage: true,
      });

      await controller.getTmdbMovies(filters as unknown as MediaFilterDto);

      expect(mockMovieService.getMovieListForWholePage).toHaveBeenCalledWith(
        1,
        filters.sort,
        filters,
      );
    });
  });

  describe('searchTmdbMovies', () => {
    const mockSearchResponse: MediaListDto = {
      mediaList: [
        {
          id: 101,
          title: 'Inception',
          posterPath: '/inception.jpg',
          releaseDate: '2010-07-16',
        } as TmdbListMediaDto,
      ],
      lastPage: true,
    };

    it('should return search results from the service', async () => {
      const query = 'Inception';
      const page = '1';

      (service.searchMoviesForWholePage as jest.Mock).mockResolvedValue(
        mockSearchResponse,
      );

      const result = await controller.searchTmdbMovies(query, page);

      expect(mockMovieService.searchMoviesForWholePage).toHaveBeenCalledWith(
        query,
        1,
      );
      expect(result).toEqual(mockSearchResponse);
    });

    it('should throw BadRequestException if query is empty or only whitespace', async () => {
      await expect(controller.searchTmdbMovies('   ')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.searchTmdbMovies('')).rejects.toThrow(
        'Query parameter is required',
      );
    });
  });

  describe('getMovieByTmdbId', () => {
    const mockMovieDetail: MovieDetailDto = {
      tmdbId: 123,
      title: 'Test Movie',
      overview: 'Movie overview',
      imagePath: '/poster.jpg',
      genres: ['Action'],
      releaseDate: '2024-01-01',
      status: 'Released',
      productionCompanies: [],
      budget: 1000000,
      revenue: 5000000,
      runtime: 120,
    };

    const mockProviders: ProviderListItemDto[] = [
      {
        tmdbId: 1,
        name: 'Netflix',
        logoPath: '/netflix.png',
      },
    ];

    it('should return movie details and providers', async () => {
      const tmdbId = '123';

      (service.findMovieFromTmdbId as jest.Mock).mockResolvedValue(
        mockMovieDetail,
      );
      (
        providersService.findProvidersOrGetFromTmdbAndFindOrCreate as jest.Mock
      ).mockResolvedValue(mockProviders);

      const result = await controller.getMovieByTmdbId(tmdbId);

      expect(result).toEqual({
        movie: mockMovieDetail,
        providers: mockProviders,
      });

      expect(mockMovieService.findMovieFromTmdbId).toHaveBeenCalledWith(123);
      expect(
        mockProvidersService.findProvidersOrGetFromTmdbAndFindOrCreate,
      ).toHaveBeenCalledWith(123, MediaType.MOVIE);
    });

    it('should return null for providers if service returns null', async () => {
      const tmdbId = '456';

      (service.findMovieFromTmdbId as jest.Mock).mockResolvedValue(
        mockMovieDetail,
      );
      (
        providersService.findProvidersOrGetFromTmdbAndFindOrCreate as jest.Mock
      ).mockResolvedValue(null);

      const result = await controller.getMovieByTmdbId(tmdbId);

      expect(result.providers).toBeNull();
    });

    it('should handle errors from MoviesService', async () => {
      const tmdbId = '999';
      (service.findMovieFromTmdbId as jest.Mock).mockRejectedValue(
        new Error('Movie not found'),
      );

      await expect(controller.getMovieByTmdbId(tmdbId)).rejects.toThrow(
        'Movie not found',
      );
    });

    it('should handle errors from ProvidersService', async () => {
      const tmdbId = '123';
      (service.findMovieFromTmdbId as jest.Mock).mockResolvedValue(
        mockMovieDetail,
      );
      (
        providersService.findProvidersOrGetFromTmdbAndFindOrCreate as jest.Mock
      ).mockRejectedValue(new Error('Providers error'));

      await expect(controller.getMovieByTmdbId(tmdbId)).rejects.toThrow(
        'Providers error',
      );
    });
  });
});
