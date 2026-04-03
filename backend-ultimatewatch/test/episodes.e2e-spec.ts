import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EpisodeService } from '../src/episodes/episodes.service';
import { App } from 'supertest/types';
import { EpisodeResponseDto } from '../src/episodes/dto/episode-response-dto';

describe('EpisodeController (e2e)', () => {
  let app: INestApplication;

  const mockEpisodeResponse: EpisodeResponseDto = {
    data: [
      {
        tmdbId: 1,
        title: 'Winter Is Coming',
        number: 1,
        releaseDate: '2011-04-17',
        overview: 'Overview 1',
        imagePath: '/path1.jpg',
      },
      {
        tmdbId: 2,
        title: 'The Kingsroad',
        number: 2,
        releaseDate: '2011-04-24',
        overview: 'Overview 2',
        imagePath: '/path2.jpg',
      },
    ],
    total: 2,
    page: 1,
    lastPage: 1,
  };

  const mockEpisodeService = {
    findOrCreate: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EpisodeService)
      .useValue(mockEpisodeService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/episodes/season/:id (GET)', () => {
    it('should return 200 and the list of episodes with default page', () => {
      const seasonTmdbId = '3624';
      mockEpisodeService.findOrCreate.mockResolvedValue(mockEpisodeResponse);

      return request(app.getHttpServer() as App)
        .get(`/episodes/season/${seasonTmdbId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as EpisodeResponseDto;

          expect(body.data).toHaveLength(2);
          expect(body.data[0].title).toBe('Winter Is Coming');
          expect(body.total).toBe(2);

          expect(mockEpisodeService.findOrCreate).toHaveBeenCalledWith(3624, 1);
        });
    });

    it('should return 200 and handle custom page query', () => {
      const seasonTmdbId = '3624';
      const page = '2';

      mockEpisodeService.findOrCreate.mockResolvedValue({
        ...mockEpisodeResponse,
        page: 2,
      });

      return request(app.getHttpServer() as App)
        .get(`/episodes/season/${seasonTmdbId}`)
        .query({ page })
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as EpisodeResponseDto;
          expect(body.page).toBe(2);
          expect(mockEpisodeService.findOrCreate).toHaveBeenCalledWith(3624, 2);
        });
    });

    it('should return 500 if the service fails', () => {
      mockEpisodeService.findOrCreate.mockRejectedValue(
        new Error('TMDB API Error'),
      );

      return request(app.getHttpServer() as App)
        .get('/episodes/season/123')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
