/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ProvidersService } from 'src/providers/providers.service';
import { App } from 'supertest/types';

describe('ProvidersController (e2e)', () => {
  let app: INestApplication;

  // Mock de la URL de retorno
  const mockProviderLink = {
    url: 'https://www.netflix.com/title/80057281',
  };

  const mockProvidersService = {
    findProviderUrlForMediaAndProvider: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ProvidersService)
      .useValue(mockProvidersService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/providers/link (GET)', () => {
    it('should return 200 and the provider link data', () => {
      const queryParams = {
        mediaTmdbId: 1399,
        providerTmdbId: 8,
      };

      mockProvidersService.findProviderUrlForMediaAndProvider.mockResolvedValue(
        mockProviderLink,
      );

      return request(app.getHttpServer() as App)
        .get('/providers/link')
        .query(queryParams)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as typeof mockProviderLink;

          expect(body.url).toBe(mockProviderLink.url);

          expect(
            mockProvidersService.findProviderUrlForMediaAndProvider,
          ).toHaveBeenCalledWith(
            queryParams.mediaTmdbId,
            queryParams.providerTmdbId,
          );
        });
    });

    it('should return 404 if the link is not found', () => {
      mockProvidersService.findProviderUrlForMediaAndProvider.mockRejectedValue(
        new NotFoundException('Provider link not found'),
      );

      return request(app.getHttpServer() as App)
        .get('/providers/link')
        .query({ mediaTmdbId: 1, providerTmdbId: 1 })
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body['message']).toBe('Provider link not found');
        });
    });

    it('should return 400 if query parameters are missing', () => {
      return request(app.getHttpServer() as App)
        .get('/providers/link')
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res: request.Response) => {
          const body = res.body as Record<string, any>;

          if (res.status === (HttpStatus.BAD_REQUEST as number)) {
            expect(body['error']).toBe('Bad Request');
          }
        });
    });
  });
});
