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
    searchSeriesForWholePage: jest.fn().mockResolvedValue(mockSeriesData),
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

    it('should return 200 and handle series-specific filters', () => {
      const filters = {
        page: '3',
        sort: 'first_air_date.desc',
        with_networks: '213',
        with_origin_country: 'JP',
      };

      return request(app.getHttpServer() as App)
        .get('/series/tmdb-list')
        .query(filters)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(
            mockSeriesService.getSeriesListForWholePage,
          ).toHaveBeenCalledWith(
            3,
            filters.sort,
            expect.objectContaining({
              with_networks: '213',
              with_origin_country: 'JP',
            }),
          );
        });
    });

    it('should handle request with only the sort parameter', () => {
      return request(app.getHttpServer() as App)
        .get('/series/tmdb-list')
        .query({ sort: 'popularity.asc' })
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(
            mockSeriesService.getSeriesListForWholePage,
          ).toHaveBeenCalledWith(
            1,
            'popularity.asc',
            expect.objectContaining({ sort: 'popularity.asc' }),
          );
        });
    });
  });

  describe('/series/tmdb-search (GET)', () => {
    it('should return 200 and search results for series', () => {
      const query = 'Breaking';
      return request(app.getHttpServer() as App)
        .get('/series/tmdb-search')
        .query({ query, page: '3' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(
            mockSeriesService.searchSeriesForWholePage,
          ).toHaveBeenCalledWith(query, 3);
        });
    });

    it('should use default page 1 if page query is not provided', () => {
      const query = 'Dark';
      return request(app.getHttpServer() as App)
        .get('/series/tmdb-search')
        .query({ query })
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(
            mockSeriesService.searchSeriesForWholePage,
          ).toHaveBeenCalledWith(query, 1);
        });
    });

    it('should return 400 if query is empty', () => {
      return request(app.getHttpServer() as App)
        .get('/series/tmdb-search')
        .query({ query: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
