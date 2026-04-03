/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TmdbApiService } from './tmdbapi.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ExternalApiError } from 'src/common/exceptions/external-api-error';
import { ConfigurationError } from '../exceptions/configuration-error';
import { MediaFilterDto } from '../dto/media-filter-dto';
import { MediaType } from '../enums/media.type.enum';

describe('TmdbApiService', () => {
  let service: TmdbApiService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockConfig: Record<string, string> = {
    TMDB_API_KEY: 'TMDB.valid_key',
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbApiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<TmdbApiService>(TmdbApiService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize correctly and fetch the API key', () => {
      const configSpy = jest.spyOn(configService, 'get');
      const newService = new TmdbApiService(configService, httpService);
      expect(newService).toBeDefined();
      expect(configSpy).toHaveBeenCalledWith('TMDB_API_KEY');
    });

    it('should throw ConfigurationError if TMDB_API_KEY is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      expect(() => new TmdbApiService(configService, httpService)).toThrow(
        ConfigurationError,
      );
    });
  });

  describe('getMovieListFromTmdb', () => {
    const mockAxiosResponse: AxiosResponse = {
      data: {
        results: [{ id: 1, title: 'Movie 1' }],
        total_pages: 10,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    it('should fetch movies and return mediaList and totalPages', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      const result = await service.getMovieListFromTmdb(1, 'popularity.desc');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/discover/movie'),
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            sort_by: 'popularity.desc',
          }) as Record<string, any>,
        }),
      );
      expect(result.mediaList).toBeDefined();
      expect(result.totalPages).toBe(10);
      expect(result.mediaList[0].id).toBe(1);
    });

    it('should throw ExternalApiError when TMDB request fails', async () => {
      const errorResponse = {
        response: { statusText: 'Unauthorized' },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => errorResponse));

      await expect(service.getMovieListFromTmdb(1)).rejects.toThrow(
        ExternalApiError,
      );
    });

    it('should use default sort (popularity.desc) if sort parameter is invalid for movies', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      await service.getMovieListFromTmdb(1, 'first_air_date.desc');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/discover/movie'),
        expect.objectContaining({
          params: expect.objectContaining({
            sort_by: 'popularity.desc',
          }) as Record<string, any>,
        }),
      );
    });

    it('should use provided sort if it is valid for movies', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));
      const validMovieSort = 'primary_release_date.desc';

      await service.getMovieListFromTmdb(1, validMovieSort);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            sort_by: validMovieSort,
          }) as Record<string, any>,
        }),
      );
    });

    it('should map and include media filters in the request', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      const mockFilters = { withGenres: '28' };

      await service.getMovieListFromTmdb(
        1,
        'popularity.desc',
        mockFilters as unknown as MediaFilterDto,
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            with_genres: '28',
            page: 1,
          }) as Record<string, any>,
        }),
      );
    });
  });

  describe('getSeriesListFromTmdb', () => {
    const mockAxiosResponse: AxiosResponse = {
      data: {
        results: [{ id: 10, name: 'Series 1' }],
        total_pages: 5,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    it('should fetch series with correct Authorization header', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      const result = await service.getSeriesListFromTmdb(2);

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockConfig.TMDB_API_KEY}`,
            accept: 'application/json',
          }) as Record<string, any>,
          params: expect.objectContaining({
            page: 2,
          }) as Record<string, any>,
        }),
      );
      expect(result.totalPages).toBe(5);
    });

    it('should return series results from TMDB response', async () => {
      const response = {
        ...mockAxiosResponse,
        data: {
          results: [{ id: 5, name: 'Series 5' }],
          total_pages: 1,
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(response));

      const result = await service.getSeriesListFromTmdb(1);

      expect(result.mediaList).toHaveLength(1);
      expect(result.mediaList[0].id).toBe(5);
    });

    it('should use default sort if sort parameter is invalid for series', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      await service.getSeriesListFromTmdb(1, 'revenue.desc');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('/discover/tv'),
        expect.objectContaining({
          params: expect.objectContaining({
            sort_by: 'popularity.desc',
          }) as Record<string, any>,
        }),
      );
    });

    it('should use provided sort if it is valid for series', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));
      const validSeriesSort = 'first_air_date.asc';

      await service.getSeriesListFromTmdb(1, validSeriesSort);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          params: expect.objectContaining({
            sort_by: validSeriesSort,
          }) as Record<string, any>,
        }),
      );
    });
  });

  describe('searchMoviesFromTmdb', () => {
    const mockAxiosResponse: AxiosResponse = {
      data: {
        results: [{ id: 100, title: 'Search Movie 1' }],
        total_pages: 1,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    it('should call TMDB search movie endpoint with encoded query', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      const query = 'Spider-Man';
      await service.searchMoviesFromTmdb(query, 1);

      expect(spy).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/search/movie',
        expect.objectContaining({
          params: expect.objectContaining({
            query: encodeURIComponent(query),
            page: 1,
            include_adult: false,
          }) as Record<string, any>,
        }),
      );
    });

    it('should return mapped search results and totalPages', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockAxiosResponse));

      const result = await service.searchMoviesFromTmdb('any');

      expect(result.mediaList).toBeDefined();
      expect(result.totalPages).toBe(1);
      expect(result.mediaList[0].id).toBe(100);
    });

    it('should throw ExternalApiError if movie search fails', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(
          throwError(() => ({ response: { statusText: 'Not Found' } })),
        );

      await expect(service.searchMoviesFromTmdb('any')).rejects.toThrow(
        ExternalApiError,
      );
    });
  });

  describe('searchSeriesFromTmdb', () => {
    const mockAxiosResponse: AxiosResponse = {
      data: {
        results: [{ id: 200, name: 'Search Series 1' }],
        total_pages: 2,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    it('should call TMDB search tv endpoint with correct options', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      const query = 'The Bear';
      await service.searchSeriesFromTmdb(query, 2);

      expect(spy).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/search/tv',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockConfig.TMDB_API_KEY}`,
          }) as Record<string, any>,
          params: expect.objectContaining({
            query: encodeURIComponent(query),
            page: 2,
          }) as Record<string, any>,
        }),
      );
    });

    it('should return search results and totalPages', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockAxiosResponse));

      const result = await service.searchSeriesFromTmdb('any');

      expect(result.mediaList).toBeDefined();
      expect(result.totalPages).toBe(2);
      expect(result.mediaList[0].id).toBe(200);
    });

    it('should throw ExternalApiError if series search fails', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(
          throwError(() => ({ response: { statusText: 'Bad Gateway' } })),
        );

      await expect(service.searchSeriesFromTmdb('any')).rejects.toThrow(
        ExternalApiError,
      );
    });
  });

  describe('Individual Resource Fetching', () => {
    const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    it('getMovieFromTmdb should fetch a single movie', async () => {
      const movieData = { id: 550, title: 'Fight Club' };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse(movieData)));

      const result = await service.getMovieFromTmdb(550);
      expect(result).toEqual(movieData);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/movie/550'),
        expect.anything(),
      );
    });

    it('getSeriesFromTmdb should fetch a single series', async () => {
      const seriesData = { id: 1399, name: 'Game of Thrones' };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse(seriesData)));

      const result = await service.getSeriesFromTmdb(1399);
      expect(result).toEqual(seriesData);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/tv/1399'),
        expect.anything(),
      );
    });

    it('getSeasonFromTmdb should fetch season details', async () => {
      const seasonData = { id: 1, name: 'Season 1', episodes: [] };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse(seasonData)));

      const result = await service.getSeasonFromTmdb(1399, 1);
      expect(result).toEqual(seasonData);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/tv/1399/season/1'),
        expect.anything(),
      );
    });
  });

  describe('Additional TMDB Resources', () => {
    const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    it('getProvidersForMedia should return ES providers', async () => {
      const providerData = { results: { ES: { link: 'url', flatrate: [] } } };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse(providerData)));

      const result = await service.getProvidersForMedia(1, MediaType.MOVIE);
      expect(result).toEqual(providerData.results.ES);
    });

    it('getMediaGenres should return genre list', async () => {
      const genreData = { genres: [{ id: 1, name: 'Action' }] };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse(genreData)));

      const result = await service.getMediaGenres(MediaType.MOVIE);
      expect(result).toEqual(genreData.genres);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/genre/movie/list'),
        expect.anything(),
      );
    });

    it('getMediaPeople should fetch credits based on media type', async () => {
      const peopleData = { cast: [], crew: [] };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse(peopleData)));

      await service.getMediaPeople(1, MediaType.MOVIE);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/movie/1/credits'),
        expect.anything(),
      );

      await service.getMediaPeople(1, MediaType.SERIES);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/tv/1/aggregate_credits'),
        expect.anything(),
      );
    });

    it('getProductionCompanyFromTmdb should fetch company details', async () => {
      const companyData = { id: 1, name: 'Lucasfilm' };
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse(companyData)));

      const result = await service.getProductionCompanyFromTmdb(1);
      expect(result).toEqual(companyData);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/company/1'),
        expect.anything(),
      );
    });
  });

  describe('Error Handling Generic', () => {
    it('should throw ExternalApiError for any failed request', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(
          throwError(() => ({ response: { statusText: 'Server Error' } })),
        );

      await expect(service.getMovieFromTmdb(1)).rejects.toThrow(
        ExternalApiError,
      );
      await expect(service.getMediaGenres(MediaType.MOVIE)).rejects.toThrow(
        ExternalApiError,
      );
    });
  });
});
