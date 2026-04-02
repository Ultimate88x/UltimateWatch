/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { SeriesService } from 'src/series/series.service';
import { App } from 'supertest/types';

describe('SeriesController (e2e) - TMDB', () => {
  let app: INestApplication;

  const mockSeriesData = [
    { id: 101, title: 'Breaking Bad', posterPath: '/bb.jpg', mediaType: 'tv' },
    { id: 102, title: 'The Bear', posterPath: '/bear.jpg', mediaType: 'tv' },
  ];

  const mockSeriesService = {
    getSeriesListForWholePage: jest.fn().mockResolvedValue(mockSeriesData),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SeriesService)
      .useValue(mockSeriesService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/series/tmdb-list (GET)', () => {
    it('should return 200 and the list of series from TMDB', () => {
      return request(app.getHttpServer() as App)
        .get('/series/tmdb-list')
        .query({ page: '5' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].id).toBe(101);
          expect(
            mockSeriesService.getSeriesListForWholePage,
          ).toHaveBeenCalledWith(5, undefined, expect.any(Object));
        });
    });

    it('should handle empty results from TMDB', () => {
      mockSeriesService.getSeriesListForWholePage.mockResolvedValueOnce([]);

      return request(app.getHttpServer() as App)
        .get('/series/tmdb-list')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });
});
