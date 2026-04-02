import { Test, TestingModule } from '@nestjs/testing';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { HttpModule } from '@nestjs/axios';
import { ProvidersService } from 'src/providers/providers.service';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';

describe('SeriesController', () => {
  let controller: SeriesController;
  let service: SeriesService;

  const mockSeriesService = {
    getSeriesListForWholePage: jest.fn(),
    searchSeriesForWholePage: jest.fn(),
  };
  const mockProvidersService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [SeriesController],
      providers: [
        {
          provide: SeriesService,
          useValue: mockSeriesService,
        },
        {
          provide: ProvidersService,
          useValue: mockProvidersService,
        },
      ],
    }).compile();

    controller = module.get<SeriesController>(SeriesController);
    service = module.get<SeriesService>(SeriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTmdbSeries', () => {
    const mockSeries: TmdbListMediaDto[] = [
      {
        id: 1,
        title: 'Test Series 1',
        posterPath: '/path1.jpg',
        releaseDate: '2024-01-01',
      },
      {
        id: 2,
        title: 'Test Series 2',
        posterPath: '/path2.jpg',
        releaseDate: '2024-02-01',
      },
    ];

    it('should return a list of series from the service', async () => {
      const filters = { page: '1', sort: 'popularity.desc' };

      const spy = jest
        .spyOn(service, 'getSeriesListForWholePage')
        .mockResolvedValue(mockSeries);

      const result = await controller.getTmdbSeries(
        filters as unknown as MediaFilterDto,
      );

      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
      expect(result).toEqual(mockSeries);
    });

    it('should use default page 1 if no page is provided', async () => {
      const filters = { sort: 'vote_average.desc' };
      const spy = jest
        .spyOn(service, 'getSeriesListForWholePage')
        .mockResolvedValue([]);

      await controller.getTmdbSeries(filters as unknown as MediaFilterDto);

      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
    });

    it('should handle service failures', async () => {
      const filters = { page: '1' };
      const spy = jest
        .spyOn(service, 'getSeriesListForWholePage')
        .mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getTmdbSeries(filters as unknown as MediaFilterDto),
      ).rejects.toThrow('Service error');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('searchTmdbSeries', () => {
    const mockSearchResults: TmdbListMediaDto[] = [
      {
        id: 101,
        title: 'Breaking Bad',
        posterPath: '/bb.jpg',
        releaseDate: '2008-01-20',
      },
    ];

    it('should return search results from the service', async () => {
      const query = 'Breaking';
      const page = '2';

      const spy = jest
        .spyOn(service, 'searchSeriesForWholePage')
        .mockResolvedValue(mockSearchResults);

      const result = await controller.searchTmdbSeries(query, page);

      expect(spy).toHaveBeenCalledWith(query, 2);
      expect(result).toEqual(mockSearchResults);
    });

    it('should use default page 1 if no page is provided', async () => {
      const query = 'The Bear';

      const spy = jest
        .spyOn(service, 'searchSeriesForWholePage')
        .mockResolvedValue([]);

      await controller.searchTmdbSeries(query);

      expect(spy).toHaveBeenCalledWith(query, 1);
    });

    it('should throw BadRequestException if query is empty or only whitespace', async () => {
      const emptyQuery = '   ';

      await expect(controller.searchTmdbSeries(emptyQuery)).rejects.toThrow(
        'Query parameter is required',
      );

      await expect(controller.searchTmdbSeries('')).rejects.toThrow(
        'Query parameter is required',
      );
    });

    it('should handle service errors during series search', async () => {
      const query = 'Dark';
      jest
        .spyOn(service, 'searchSeriesForWholePage')
        .mockRejectedValue(new Error('TMDB Search Error'));

      await expect(controller.searchTmdbSeries(query, '1')).rejects.toThrow(
        'TMDB Search Error',
      );
    });
  });
});
