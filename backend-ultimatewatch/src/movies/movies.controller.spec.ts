import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { HttpModule } from '@nestjs/axios';
import { ProvidersService } from 'src/providers/providers.service';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';
import { BadRequestException } from '@nestjs/common';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  const mockMovieService = {
    getMovieListForWholePage: jest.fn(),
    searchMoviesForWholePage: jest.fn(),
  };
  const mockProvidersService = {};

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
        {
          id: 2,
          title: 'Test Movie 2',
          posterPath: '/path2.jpg',
          releaseDate: '2024-02-01',
        } as TmdbListMediaDto,
      ],
      lastPage: false,
    };

    it('should return a MediaListDto from the service', async () => {
      const filters = { page: '1', sort: 'popularity.desc' };

      const spy = jest
        .spyOn(service, 'getMovieListForWholePage')
        .mockResolvedValue(mockMediaListResponse);

      const result = await controller.getTmdbMovies(
        filters as unknown as MediaFilterDto,
      );

      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
      expect(result).toEqual(mockMediaListResponse);
      expect(result.mediaList).toHaveLength(2);
    });

    it('should use default page 1 if no page is provided', async () => {
      const filters = { sort: 'vote_average.desc' };
      const spy = jest
        .spyOn(service, 'getMovieListForWholePage')
        .mockResolvedValue({ mediaList: [], lastPage: true });

      await controller.getTmdbMovies(filters as unknown as MediaFilterDto);

      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
    });

    it('should handle service failures', async () => {
      const filters = { page: '1' };
      jest
        .spyOn(service, 'getMovieListForWholePage')
        .mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getTmdbMovies(filters as unknown as MediaFilterDto),
      ).rejects.toThrow('Service error');
    });
  });

  describe('searchTmdbMovies', () => {
    const mockSearchResponse: MediaListDto = {
      mediaList: [
        {
          id: 101,
          title: 'Found Movie',
          posterPath: '/p.jpg',
          releaseDate: '2024',
        } as TmdbListMediaDto,
      ],
      lastPage: true,
    };

    it('should return search results from the service', async () => {
      const query = 'Inception';
      const page = '1';

      const spy = jest
        .spyOn(service, 'searchMoviesForWholePage')
        .mockResolvedValue(mockSearchResponse);

      const result = await controller.searchTmdbMovies(query, page);

      expect(spy).toHaveBeenCalledWith(query, 1);
      expect(result).toEqual(mockSearchResponse);
    });

    it('should use default page 1 if no page is provided', async () => {
      const query = 'Interstellar';

      const spy = jest
        .spyOn(service, 'searchMoviesForWholePage')
        .mockResolvedValue({ mediaList: [], lastPage: true });

      await controller.searchTmdbMovies(query);

      expect(spy).toHaveBeenCalledWith(query, 1);
    });

    it('should throw BadRequestException if query is missing or empty', async () => {
      const emptyQuery = '   ';

      await expect(controller.searchTmdbMovies(emptyQuery)).rejects.toThrow(
        BadRequestException,
      );

      await expect(
        controller.searchTmdbMovies(undefined as unknown as string),
      ).rejects.toThrow('Query parameter is required');
    });

    it('should handle service errors during search', async () => {
      const query = 'Batman';
      jest
        .spyOn(service, 'searchMoviesForWholePage')
        .mockRejectedValue(new Error('Search failed'));

      await expect(controller.searchTmdbMovies(query, '1')).rejects.toThrow(
        'Search failed',
      );
    });
  });
});
