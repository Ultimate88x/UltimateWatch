/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { WatchmodeService } from './watchmode.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MediaType } from '../enums/media.type.enum';
import { of, throwError } from 'rxjs';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ExternalApiError } from '../exceptions/external-api-error';
import { ConfigurationError } from '../exceptions/configuration-error';

describe('WatchmodeService', () => {
  let service: WatchmodeService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockConfig: Record<string, string> = {
    WATCHMODE_API_KEY: 'valid_api_key',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchmodeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WatchmodeService>(WatchmodeService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw ConfigurationError if API key is missing', () => {
      configService.get.mockReturnValue(undefined);

      expect(() => {
        new WatchmodeService(configService, httpService);
      }).toThrow(ConfigurationError);
    });
  });

  describe('getProvidersForMediaFromWatchmode', () => {
    const mockId = 123;
    const mockType = MediaType.MOVIE;
    const mockProvidersData = [{ source_id: 1, name: 'Netflix', type: 'sub' }];

    it('should return providers data on successful API call', async () => {
      const axiosResponse: AxiosResponse = {
        data: mockProvidersData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      httpService.get.mockReturnValue(of(axiosResponse));

      const result = await service.getProvidersForMediaFromWatchmode(
        mockId,
        mockType,
      );

      expect(result).toEqual(mockProvidersData);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('movie-123'),
        expect.objectContaining({
          params: expect.objectContaining({
            apiKey: 'valid_api_key',
          }) as Record<string, any>,
        }),
      );
    });

    it('should throw ExternalApiError when the API call fails', async () => {
      const mockError = {
        response: {
          status: 404,
          statusText: 'Not Found',
        },
      };

      // Simulamos un error en el flujo de RxJS
      httpService.get.mockReturnValue(throwError(() => mockError));

      await expect(
        service.getProvidersForMediaFromWatchmode(mockId, mockType),
      ).rejects.toThrow(ExternalApiError);
    });
  });
});
