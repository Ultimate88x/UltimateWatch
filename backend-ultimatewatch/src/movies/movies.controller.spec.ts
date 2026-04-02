import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { HttpModule } from '@nestjs/axios';
import { ProvidersService } from 'src/providers/providers.service';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  const mockMovieService = {
    getMovieListForWholePage: jest.fn(),
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
    const mockMovies: TmdbListMediaDto[] = [
      {
        id: 1,
        title: 'Test Movie 1',
        posterPath: '/path1.jpg',
        releaseDate: '2024-01-01',
      },
      {
        id: 2,
        title: 'Test Movie 2',
        posterPath: '/path2.jpg',
        releaseDate: '2024-02-01',
      },
    ];

    it('should return a list of movies from the service', async () => {
      const filters = { page: '1', sort: 'popularity.desc' };

      const spy = jest
        .spyOn(service, 'getMovieListForWholePage')
        .mockResolvedValue(mockMovies);

      const result = await controller.getTmdbMovies(
        filters as unknown as MediaFilterDto,
      );

      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
      expect(result).toEqual(mockMovies);
    });

    it('should use default page 1 if no page is provided', async () => {
      const filters = { sort: 'vote_average.desc' };
      const spy = jest
        .spyOn(service, 'getMovieListForWholePage')
        .mockResolvedValue([]);

      await controller.getTmdbMovies(filters as unknown as MediaFilterDto);

      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
    });

    it('should handle service failures', async () => {
      const filters = { page: '1' };
      const spy = jest
        .spyOn(service, 'getMovieListForWholePage')
        .mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getTmdbMovies(filters as unknown as MediaFilterDto),
      ).rejects.toThrow('Service error');
      expect(spy).toHaveBeenCalled();
    });
  });
});
