import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GenresService } from '../src/genres/genres.service';
import { App } from 'supertest/types';
import { GenreDetailDto } from '../src/genres/dto/genre-list-dto';

describe('GenresController (e2e)', () => {
  let app: INestApplication;

  const mockMovieGenres: GenreDetailDto[] = [
    { tmdbId: 28, name: 'Action' },
    { tmdbId: 12, name: 'Adventure' },
  ];

  const mockSeriesGenres: GenreDetailDto[] = [
    { tmdbId: 10759, name: 'Action & Adventure' },
    { tmdbId: 18, name: 'Drama' },
  ];

  const mockGenresService = {
    findForMovies: jest.fn().mockResolvedValue(mockMovieGenres),
    findForSeries: jest.fn().mockResolvedValue(mockSeriesGenres),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GenresService)
      .useValue(mockGenresService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/genres/movie (GET)', () => {
    it('should return 200 and the list of movie genres', () => {
      return request(app.getHttpServer() as App)
        .get('/genres/movie')
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GenreDetailDto[];

          expect(Array.isArray(body)).toBe(true);
          expect(body).toHaveLength(2);
          expect(body[0].name).toBe('Action');
          expect(mockGenresService.findForMovies).toHaveBeenCalledTimes(1);
        });
    });
  });

  describe('/genres/series (GET)', () => {
    it('should return 200 and the list of series genres', () => {
      return request(app.getHttpServer() as App)
        .get('/genres/series')
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as GenreDetailDto[];

          expect(Array.isArray(body)).toBe(true);
          expect(body[1].name).toBe('Drama');
          expect(mockGenresService.findForSeries).toHaveBeenCalledTimes(1);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 500 if the service fails unexpectedly', () => {
      mockGenresService.findForMovies.mockRejectedValueOnce(
        new Error('DB Error'),
      );

      return request(app.getHttpServer() as App)
        .get('/genres/movie')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
