import { Test, TestingModule } from '@nestjs/testing';
import { TmdbApiService } from './tmdbapi.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ExternalApiError } from 'src/common/exceptions/external-api-error';
import { ConfigurationError } from '../exceptions/configuration-error';

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
      data: { results: [{ id: 1, title: 'Movie 1' }] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    it('should fetch movies and return filtered results', async () => {
      // Usamos spyOn para evitar el error de unbound-method del linter
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      const result = await service.getMovieListFromTmdb(1, 'popularity.desc');

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            sort_by: expect.any(String) as string,
          }) as Record<string, any>,
        }) as object,
      );
      expect(result).toBeDefined();
      expect(result[0].id).toBe(1);
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
  });

  describe('getSeriesListFromTmdb', () => {
    const mockAxiosResponse: AxiosResponse = {
      data: { results: [{ id: 10, name: 'Series 1' }] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    it('should fetch series with correct Authorization header', async () => {
      const spy = jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(mockAxiosResponse));

      await service.getSeriesListFromTmdb(2);

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockConfig.TMDB_API_KEY}`,
            accept: 'application/json',
          }) as Record<string, any>,
          params: expect.objectContaining({
            page: 2,
            sort_by: expect.any(String) as string,
          }) as Record<string, any>,
        }) as object,
      );
    });

    it('should filter duplicates from TMDB response', async () => {
      const responseWithDuplicates = {
        ...mockAxiosResponse,
        data: {
          results: [
            { id: 5, name: 'Duplicated' },
            { id: 5, name: 'Duplicated' },
          ],
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(of(responseWithDuplicates));

      const result = await service.getSeriesListFromTmdb(1);

      // Verificamos que la lógica interna de filterDuplicateMedia funciona
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(5);
    });
  });
});
