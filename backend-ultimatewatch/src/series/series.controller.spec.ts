import { Test, TestingModule } from '@nestjs/testing';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { HttpModule } from '@nestjs/axios';
import { ProvidersService } from 'src/providers/providers.service';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';
import { BadRequestException } from '@nestjs/common';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { MediaType } from 'src/common/enums/media.type.enum';
import { SeriesDetailDto } from './dto/series-detail-dto';
import { ProviderListItemDto } from 'src/providers/dto/provider-list-item-dto';

describe('SeriesController', () => {
  let controller: SeriesController;
  let service: SeriesService;
  let providersService: ProvidersService;

  const mockSeriesService = {
    getSeriesListForWholePage: jest.fn(),
    searchSeriesForWholePage: jest.fn(),
    findSeriesFromTmdbId: jest.fn(),
  };

  const mockProvidersService = {
    findProvidersOrGetFromTmdbAndFindOrCreate: jest.fn(),
  };

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
    providersService = module.get<ProvidersService>(ProvidersService);
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
      ],
      lastPage: false,
    };

    it('should return a MediaListDto from the service', async () => {
      const filters = { page: '1', sort: 'popularity.desc' };

      (service.getSeriesListForWholePage as jest.Mock).mockResolvedValue(
        mockMediaListResponse,
      );

      const result = await controller.getTmdbSeries(
        filters as unknown as MediaFilterDto,
      );

      expect(mockSeriesService.getSeriesListForWholePage).toHaveBeenCalledWith(
        1,
        filters.sort,
        filters,
      );
      expect(result).toEqual(mockMediaListResponse);
    });

    it('should use default page 1 if no page is provided', async () => {
      const filters = { sort: 'vote_average.desc' };
      (service.getSeriesListForWholePage as jest.Mock).mockResolvedValue({
        mediaList: [],
        lastPage: true,
      });

      await controller.getTmdbSeries(filters as unknown as MediaFilterDto);

      expect(mockSeriesService.getSeriesListForWholePage).toHaveBeenCalledWith(
        1,
        filters.sort,
        filters,
      );
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

      (service.searchSeriesForWholePage as jest.Mock).mockResolvedValue(
        mockSearchResponse,
      );

      const result = await controller.searchTmdbSeries(query, page);

      expect(mockSeriesService.searchSeriesForWholePage).toHaveBeenCalledWith(
        query,
        2,
      );
      expect(result).toEqual(mockSearchResponse);
    });

    it('should throw BadRequestException if query is empty or only whitespace', async () => {
      await expect(controller.searchTmdbSeries('   ')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.searchTmdbSeries('')).rejects.toThrow(
        'Query parameter is required',
      );
    });
  });

  describe('getSeriesByTmdbId', () => {
    const mockSeriesDetail: SeriesDetailDto = {
      tmdbId: 123,
      title: 'Test Series',
      overview: 'Overview',
      imagePath: '/poster.jpg',
      genres: ['Drama'],
      releaseDate: '2020-01-01',
      lastAirDate: '2022-01-01',
      status: 'Ended',
      productionCompanies: [],
      seasonsInfo: [],
      seasonsNumber: 1,
    };

    const mockProviders: ProviderListItemDto[] = [
      {
        tmdbId: 1,
        name: 'Netflix',
        logoPath: '/netflix.png',
      },
    ];

    it('should return series details and providers', async () => {
      const tmdbId = '123';

      (service.findSeriesFromTmdbId as jest.Mock).mockResolvedValue(
        mockSeriesDetail,
      );
      (
        providersService.findProvidersOrGetFromTmdbAndFindOrCreate as jest.Mock
      ).mockResolvedValue(mockProviders);

      const result = await controller.getSeriesByTmdbId(tmdbId);

      expect(result).toEqual({
        series: mockSeriesDetail,
        providers: mockProviders,
      });

      expect(mockSeriesService.findSeriesFromTmdbId).toHaveBeenCalledWith(123);
      expect(
        mockProvidersService.findProvidersOrGetFromTmdbAndFindOrCreate,
      ).toHaveBeenCalledWith(123, MediaType.SERIES);
    });

    it('should return null for providers if service returns null', async () => {
      const tmdbId = '456';

      (service.findSeriesFromTmdbId as jest.Mock).mockResolvedValue(
        mockSeriesDetail,
      );
      (
        providersService.findProvidersOrGetFromTmdbAndFindOrCreate as jest.Mock
      ).mockResolvedValue(null);

      const result = await controller.getSeriesByTmdbId(tmdbId);

      expect(result.providers).toBeNull();
    });

    it('should handle errors from SeriesService', async () => {
      const tmdbId = '999';
      const serviceError = new Error('Series not found');

      (service.findSeriesFromTmdbId as jest.Mock).mockRejectedValue(
        serviceError,
      );

      await expect(controller.getSeriesByTmdbId(tmdbId)).rejects.toThrow(
        'Series not found',
      );
    });

    it('should handle errors from ProvidersService', async () => {
      const tmdbId = '123';
      const providersError = new Error('Providers error');

      (service.findSeriesFromTmdbId as jest.Mock).mockResolvedValue(
        mockSeriesDetail,
      );
      (
        providersService.findProvidersOrGetFromTmdbAndFindOrCreate as jest.Mock
      ).mockRejectedValue(providersError);

      await expect(controller.getSeriesByTmdbId(tmdbId)).rejects.toThrow(
        'Providers error',
      );
    });
  });
});
