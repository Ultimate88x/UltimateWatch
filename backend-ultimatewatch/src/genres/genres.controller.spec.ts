/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { GenreDetailDto } from './dto/genre-list-dto';

describe('GenresController', () => {
  let controller: GenresController;
  let service: GenresService;

  const mockGenresService = {
    findForMovies: jest.fn(),
    findForSeries: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [
        {
          provide: GenresService,
          useValue: mockGenresService,
        },
      ],
    }).compile();

    controller = module.get<GenresController>(GenresController);
    service = module.get<GenresService>(GenresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMovieGenres', () => {
    it('should return an array of movie genres from the service', async () => {
      const mockData: GenreDetailDto[] = [
        new GenreDetailDto({ tmdbId: 1, name: 'Action' }),
      ];

      mockGenresService.findForMovies.mockResolvedValue(mockData);

      const result = await controller.getMovieGenres();

      expect(result).toEqual(mockData);
      expect(service.findForMovies).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSeriesGenres', () => {
    it('should return an array of series genres from the service', async () => {
      const mockData: GenreDetailDto[] = [
        new GenreDetailDto({ tmdbId: 2, name: 'Comedy' }),
      ];

      mockGenresService.findForSeries.mockResolvedValue(mockData);

      const result = await controller.getSeriesGenres();

      expect(result).toEqual(mockData);
      expect(service.findForSeries).toHaveBeenCalledTimes(1);
    });
  });
});
