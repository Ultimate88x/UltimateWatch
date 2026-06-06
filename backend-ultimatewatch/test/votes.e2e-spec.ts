/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  ValidationPipe,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { VotesService } from 'src/votes/votes.service';
import { SeedService } from 'src/common/seed/seed.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { App } from 'supertest/types';

describe('VotesController (e2e)', () => {
  let app: INestApplication;

  const mockVotesService = {
    findVotedMediaIdsByUserIdAndEventId: jest.fn(),
    createVote: jest.fn(),
    deleteVote: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { userId: 1 };
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VotesService)
      .useValue(mockVotesService)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideProvider(SeedService)
      .useValue({
        onApplicationBootstrap: jest.fn(),
        runSeed: jest.fn(),
      })
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

  describe('/votes/event/:eventId (GET)', () => {
    it('should return 200 and voted media ids', () => {
      mockVotesService.findVotedMediaIdsByUserIdAndEventId.mockResolvedValue([
        101, 102,
      ]);

      return request(app.getHttpServer() as App)
        .get('/votes/event/5')
        .expect(HttpStatus.OK);
    });
  });

  describe('/votes (POST)', () => {
    it('should return 201 when vote is created', () => {
      const dto = { eventId: 5, mediaId: 101 };
      mockVotesService.createVote.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .post('/votes')
        .send(dto)
        .expect(HttpStatus.CREATED)
        .expect({ message: 'Vote created succesfully!' });
    });
  });

  describe('/votes (DELETE)', () => {
    it('should return 200 when vote is deleted', () => {
      const dto = { eventId: 5, mediaId: 101 };
      mockVotesService.deleteVote.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .delete('/votes')
        .send(dto)
        .expect(HttpStatus.OK)
        .expect({ message: 'Vote deleted succesfully!' });
    });
  });
});
