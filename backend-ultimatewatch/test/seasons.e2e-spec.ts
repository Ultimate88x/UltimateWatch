/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { SeasonService } from 'src/seasons/seasons.service';
import { App } from 'supertest/types';
import { SeasonDetailDto } from 'src/seasons/dto/season-detail-dto';
import { SeedService } from 'src/common/seed/seed.service';

describe('SeasonController (e2e)', () => {
  let app: INestApplication;

  const mockSeasonDetail: Partial<SeasonDetailDto> = {
    tmdbId: 1,
    title: 'Season 1',
    number: 1,
  };

  const mockSeasonService = {
    findSeasonDetailDtoBySeriesIdAndNumber: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SeasonService)
      .useValue(mockSeasonService)
      .overrideProvider(SeedService)
      .useValue({
        onApplicationBootstrap: jest.fn(),
        runSeed: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/seasons/series/:id/:number (GET)', () => {
    it('should return 200 and the season detail', () => {
      const seriesId = '1399';
      const seasonNumber = '1';

      mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber.mockResolvedValue(
        mockSeasonDetail,
      );

      return request(app.getHttpServer() as App)
        .get(`/seasons/series/${seriesId}/${seasonNumber}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as SeasonDetailDto;

          expect(body.title).toBe('Season 1');
          expect(body.number).toBe(1);

          expect(
            mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber,
          ).toHaveBeenCalledWith(1399, 1);
        });
    });

    it('should return 404 if the season does not exist', () => {
      mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber.mockRejectedValue(
        new NotFoundException('Season not found'),
      );

      return request(app.getHttpServer() as App)
        .get('/seasons/series/1/99')
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body['message']).toBe('Season not found');
        });
    });

    it('should return 500 if the service fails unexpectedly', () => {
      mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber.mockRejectedValue(
        new Error('Unexpected error'),
      );

      return request(app.getHttpServer() as App)
        .get('/seasons/series/1/1')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
