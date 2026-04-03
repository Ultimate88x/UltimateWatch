import { Test, TestingModule } from '@nestjs/testing';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { HttpModule } from '@nestjs/axios';
import { ProvidersService } from 'src/providers/providers.service';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';
import { BadRequestException } from '@nestjs/common';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';

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
    const mockMediaListResponse: MediaListDto = {
      mediaList: [
        {
          id: 1,
          title: 'Test Series 1',
          posterPath: '/path1.jpg',
          releaseDate: '2024-01-01',
        } as TmdbListMediaDto,
        {
          id: 2,
          title: 'Test Series 2',
          posterPath: '/path2.jpg',
          releaseDate: '2024-02-01',
        } as TmdbListMediaDto,
      ],
      lastPage: false,
    };

    it('should return a MediaListDto from the service', async () => {
      const filters = { page: '1', sort: 'popularity.desc' };

      const spy = jest
        .spyOn(service, 'getSeriesListForWholePage')
        .mockResolvedValue(mockMediaListResponse);

      const result = await controller.getTmdbSeries(
        filters as unknown as MediaFilterDto,
      );

      // Verificamos que se llame con +page (numérico)
      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
      expect(result).toEqual(mockMediaListResponse);
    });

    it('should use default page 1 if no page is provided', async () => {
      const filters = { sort: 'vote_average.desc' };
      const spy = jest
        .spyOn(service, 'getSeriesListForWholePage')
        .mockResolvedValue({ mediaList: [], lastPage: true });

      await controller.getTmdbSeries(filters as unknown as MediaFilterDto);

      expect(spy).toHaveBeenCalledWith(1, filters.sort, filters);
    });

    it('should handle service failures', async () => {
      const filters = { page: '1' };
      jest
        .spyOn(service, 'getSeriesListForWholePage')
        .mockRejectedValue(new Error('Service error'));

      await expect(
        controller.getTmdbSeries(filters as unknown as MediaFilterDto),
      ).rejects.toThrow('Service error');
    });
  });

  describe('searchTmdbSeries', () => {
    const mockSearchResponse: MediaListDto = {
      mediaList: [
        {
          id: 101,
          title: 'Breaking Bad',
          posterPath: '/bb.jpg',
          releaseDate: '2008-01-20',
        } as TmdbListMediaDto,
      ],
      lastPage: true,
    };

    it('should return search results from the service', async () => {
      const query = 'Breaking';
      const page = '2';

      const spy = jest
        .spyOn(service, 'searchSeriesForWholePage')
        .mockResolvedValue(mockSearchResponse);

      const result = await controller.searchTmdbSeries(query, page);

      expect(spy).toHaveBeenCalledWith(query, 2);
      expect(result).toEqual(mockSearchResponse);
    });

    it('should use default page 1 if no page is provided', async () => {
      const query = 'The Bear';

      const spy = jest
        .spyOn(service, 'searchSeriesForWholePage')
        .mockResolvedValue({ mediaList: [], lastPage: true });

      await controller.searchTmdbSeries(query);

      expect(spy).toHaveBeenCalledWith(query, 1);
    });

    it('should throw BadRequestException if query is empty or only whitespace', async () => {
      const emptyQuery = '   ';

      await expect(controller.searchTmdbSeries(emptyQuery)).rejects.toThrow(
        BadRequestException,
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
