/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  ValidationPipe,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { EventMetricsService } from 'src/event-metrics/event-metrics.service';
import { SeedService } from 'src/common/seed/seed.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { App } from 'supertest/types';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

describe('EventMetricsController (e2e)', () => {
  let app: INestApplication;

  const mockEventMetricsService = {
    getEventStatistics: jest.fn(),
    getUserStatistics: jest.fn(),
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
      .overrideProvider(EventMetricsService)
      .useValue(mockEventMetricsService)
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

  describe('/event-metrics/event/:eventId (GET)', () => {
    const eventId = 10;
    const url = `/event-metrics/event/${eventId}`;

    it('should return 200 and the event statistics', () => {
      const mockEventMetrics = {
        totalAttendees: 15,
        peakConcurrentUsers: 12,
        messagesSent: 45,
      };

      mockEventMetricsService.getEventStatistics.mockResolvedValue(
        mockEventMetrics,
      );

      return request(app.getHttpServer() as App)
        .get(url)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockEventMetrics);
          expect(
            mockEventMetricsService.getEventStatistics,
          ).toHaveBeenCalledWith(1, eventId);
        });
    });

    it('should return 404 if the event is not found or not finished', () => {
      mockEventMetricsService.getEventStatistics.mockRejectedValue(
        new ResourceNotFoundException('Event', 'ID', String(eventId)),
      );

      return request(app.getHttpServer() as App)
        .get(url)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });

    it('should return 500 if the service fails unexpectedly', () => {
      mockEventMetricsService.getEventStatistics.mockRejectedValue(
        new Error('DB Error'),
      );

      return request(app.getHttpServer() as App)
        .get(url)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/event-metrics/user/:userId (GET)', () => {
    const targetUserId = 2;
    const url = `/event-metrics/user/${targetUserId}`;

    it('should return 200 and the user statistics', () => {
      const mockUserMetrics = {
        eventsAttended: 5,
        eventsCreated: 2,
        totalWatchTime: 120,
      };

      mockEventMetricsService.getUserStatistics.mockResolvedValue(
        mockUserMetrics,
      );

      return request(app.getHttpServer() as App)
        .get(url)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockUserMetrics);
          expect(
            mockEventMetricsService.getUserStatistics,
          ).toHaveBeenCalledWith(targetUserId);
        });
    });

    it('should return 404 if the user is not found', () => {
      mockEventMetricsService.getUserStatistics.mockRejectedValue(
        new ResourceNotFoundException('User', 'ID', String(targetUserId)),
      );

      return request(app.getHttpServer() as App)
        .get(url)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });

    it('should return 500 if the service fails unexpectedly', () => {
      mockEventMetricsService.getUserStatistics.mockRejectedValue(
        new Error('Unexpected metrics DB error'),
      );

      return request(app.getHttpServer() as App)
        .get(url)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
