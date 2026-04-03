import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PersonService } from 'src/person/person.service';
import { App } from 'supertest/types';
import { MediaType } from 'src/common/enums/media.type.enum';

describe('PersonController (e2e)', () => {
  let app: INestApplication;

  const mockCastResponse = {
    cast: [{ id: 1, name: 'Actor Name', character: 'Character Name' }],
    total: 1,
  };

  const mockCrewResponse = {
    crew: [{ id: 2, name: 'Director Name', job: 'Director' }],
    total: 1,
  };

  const mockPersonService = {
    findCastByTmdbId: jest.fn(),
    findCrewByTmdbId: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PersonService)
      .useValue(mockPersonService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Movies - Cast & Crew', () => {
    it('/person/movies/cast/:tmdbId (GET) - should return cast for a movie', () => {
      mockPersonService.findCastByTmdbId.mockResolvedValue(mockCastResponse);

      return request(app.getHttpServer() as App)
        .get('/person/movies/cast/550')
        .query({ page: 1, limit: 5 })
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as typeof mockCastResponse;
          expect(body.cast).toHaveLength(1);
          expect(mockPersonService.findCastByTmdbId).toHaveBeenCalledWith(
            550,
            1,
            5,
            MediaType.MOVIE,
          );
        });
    });

    it('/person/movies/crew/:tmdbId (GET) - should return crew for a movie', () => {
      mockPersonService.findCrewByTmdbId.mockResolvedValue(mockCrewResponse);

      return request(app.getHttpServer() as App)
        .get('/person/movies/crew/550')
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as typeof mockCrewResponse;
          expect(body.crew[0].job).toBe('Director');
          expect(mockPersonService.findCrewByTmdbId).toHaveBeenCalledWith(
            550,
            1,
            6,
            MediaType.MOVIE,
          );
        });
    });
  });

  describe('Series - Cast & Crew', () => {
    it('/person/series/cast/:tmdbId (GET) - should return cast for a series', () => {
      mockPersonService.findCastByTmdbId.mockResolvedValue(mockCastResponse);

      return request(app.getHttpServer() as App)
        .get('/person/series/cast/1399')
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(mockPersonService.findCastByTmdbId).toHaveBeenCalledWith(
            1399,
            1,
            6,
            MediaType.SERIES,
          );
        });
    });

    it('/person/series/crew/:tmdbId (GET) - should return crew for a series', () => {
      mockPersonService.findCrewByTmdbId.mockResolvedValue(mockCrewResponse);

      return request(app.getHttpServer() as App)
        .get('/person/series/crew/1399')
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(mockPersonService.findCrewByTmdbId).toHaveBeenCalledWith(
            1399,
            1,
            6,
            MediaType.SERIES,
          );
        });
    });
  });

  describe('Edge Cases', () => {
    it('should return 200 and null if service returns null', () => {
      mockPersonService.findCastByTmdbId.mockResolvedValue(null);

      return request(app.getHttpServer() as App)
        .get('/person/movies/cast/999999')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({});
        });
    });
  });
});
