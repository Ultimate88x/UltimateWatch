import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { MoviesService } from 'src/movies/movies.service';
import { App } from 'supertest/types';
import { ProvidersService } from 'src/providers/providers.service';

describe('MoviesController (e2e) - TMDB', () => {
  let app: INestApplication;

  const mockMoviesData = [
    { id: 1, title: 'Inception', posterPath: '/path1.jpg', mediaType: 'movie' },
    {
      id: 2,
      title: 'Interstellar',
      posterPath: '/path2.jpg',
      mediaType: 'movie',
    },
  ];

  const mockMovieDetail = {
    tmdbId: 1,
    title: 'Inception',
    overview: 'A thief who steals corporate secrets...',
    runtime: 148,
  };

  const mockProvidersData = [
    { providerId: 8, providerName: 'Netflix', logoPath: '/n.jpg' },
  ];

  const mockMoviesService = {
    getMovieListForWholePage: jest.fn().mockResolvedValue(mockMoviesData),
    searchMoviesForWholePage: jest.fn().mockResolvedValue(mockMoviesData),
    findMovieFromTmdbId: jest.fn().mockResolvedValue(mockMovieDetail),
  };

  const mockProvidersService = {
    findProvidersOrGetFromTmdbAndFindOrCreate: jest
      .fn()
      .mockResolvedValue(mockProvidersData),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MoviesService)
      .useValue(mockMoviesService)
      .overrideProvider(ProvidersService)
      .useValue(mockProvidersService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/movies/tmdb-list (GET)', () => {
    it('should return 200 and the list of movies from TMDB', () => {
      return request(app.getHttpServer() as App)
        .get('/movies/tmdb-list')
        .query({ page: 1, sort: 'popularity.desc' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toEqual(mockMoviesData);
          expect(
            mockMoviesService.getMovieListForWholePage,
          ).toHaveBeenCalledWith(1, 'popularity.desc', expect.any(Object));
        });
    });

    it('should return 200 and pass all filters to the service', () => {
      const filters = {
        page: '2',
        sort: 'revenue.desc',
        with_genres: '28,12',
        primary_release_year: '2024',
      };

      return request(app.getHttpServer() as App)
        .get('/movies/tmdb-list')
        .query(filters)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockMoviesData);
          expect(
            mockMoviesService.getMovieListForWholePage,
          ).toHaveBeenCalledWith(
            2,
            filters.sort,
            expect.objectContaining({
              page: '2',
              sort: 'revenue.desc',
              with_genres: '28,12',
            }),
          );
        });
    });

    it('should use default page 1 if no page is provided', () => {
      return request(app.getHttpServer() as App)
        .get('/movies/tmdb-list')
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(
            mockMoviesService.getMovieListForWholePage,
          ).toHaveBeenCalledWith(1, undefined, expect.any(Object));
        });
    });
  });

  describe('/movies/tmdb-search (GET)', () => {
    it('should return 200 and search results', () => {
      const query = 'Inception';
      return request(app.getHttpServer() as App)
        .get('/movies/tmdb-search')
        .query({ query, page: '2' })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockMoviesData);
          expect(
            mockMoviesService.searchMoviesForWholePage,
          ).toHaveBeenCalledWith(query, 2);
        });
    });

    it('should return 400 Bad Request if query is missing', () => {
      return request(app.getHttpServer() as App)
        .get('/movies/tmdb-search')
        .query({ page: '1' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 Bad Request if query is empty string', () => {
      return request(app.getHttpServer() as App)
        .get('/movies/tmdb-search')
        .query({ query: '   ' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/movies/:id (GET)', () => {
    it('should return 200, the movie detail and its providers', () => {
      const tmdbId = '1';

      return request(app.getHttpServer() as App)
        .get(`/movies/${tmdbId}`)
        .expect(HttpStatus.OK)
        .expect((res: request.Response) => {
          const body = res.body as {
            movie: typeof mockMovieDetail;
            providers: typeof mockProvidersData;
          };

          expect(body.movie).toBeDefined();
          expect(body.movie.tmdbId).toBe(1);
          expect(body.providers).toHaveLength(1);
        });
    });

    it('should return 200 and null providers if none are found', () => {
      mockProvidersService.findProvidersOrGetFromTmdbAndFindOrCreate.mockResolvedValueOnce(
        null,
      );

      return request(app.getHttpServer() as App)
        .get('/movies/2')
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as { movie: any; providers: any };

          expect(body.movie).toBeDefined();
          expect(body.providers).toBeNull();
        });
    });
  });
});
