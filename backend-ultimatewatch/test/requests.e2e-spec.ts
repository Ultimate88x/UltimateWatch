/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RequestsService } from 'src/requests/requests.service';
import { App } from 'supertest/types';
import { AuthGuard } from 'src/common/guards/auth.guard';

describe('RequestsController (e2e)', () => {
  let app: INestApplication;

  const mockRequestsService = {
    createFriendRequest: jest.fn(),
    getPendingReceivedFriendRequestsFromUser: jest.fn(),
    getPendingSentFriendRequestsFromUser: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RequestsService)
      .useValue(mockRequestsService)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
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

  describe('/requests/create/friend-request (POST)', () => {
    const validBody = { receiverId: 2 };

    it('should return 201 and success message when request is valid', () => {
      mockRequestsService.createFriendRequest.mockResolvedValue({ id: 10 });

      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send(validBody)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.message).toBe('Friend request sent successfully!');
          expect(mockRequestsService.createFriendRequest).toHaveBeenCalled();
        });
    });

    it('should return 400 if sender and receiver are the same', () => {
      const sameIdBody = { receiverId: 1 };

      mockRequestsService.createFriendRequest.mockRejectedValue(
        new BadRequestException('You cannot send a friend request to yourself'),
      );

      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send(sameIdBody)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toBe(
            'You cannot send a friend request to yourself',
          );
        });
    });

    it('should return 400 if the service throws a BadRequestException (already friends)', () => {
      const errorMsg = 'You are already friends with this user';
      mockRequestsService.createFriendRequest.mockRejectedValue(
        new BadRequestException(errorMsg),
      );

      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send(validBody)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toBe(errorMsg);
        });
    });
  });

  describe('/requests/received (GET)', () => {
    it('should return 200 and a list of pending received requests', () => {
      const mockData = [
        {
          id: 10,
          username: 'sender1',
          userImagePath: 'img1.jpg',
          createdAt: new Date().toISOString(),
        },
      ];

      mockRequestsService.getPendingReceivedFriendRequestsFromUser.mockResolvedValue(
        mockData,
      );

      return request(app.getHttpServer() as App)
        .get('/requests/received')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockData);
          expect(
            mockRequestsService.getPendingReceivedFriendRequestsFromUser,
          ).toHaveBeenCalled();
        });
    });

    it('should return 500 if the service fails', () => {
      mockRequestsService.getPendingReceivedFriendRequestsFromUser.mockRejectedValue(
        new Error(),
      );

      return request(app.getHttpServer() as App)
        .get('/requests/received')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/requests/sent (GET)', () => {
    it('should return 200 and a list of pending sent requests', () => {
      const mockData = [
        {
          id: 11,
          username: 'receiver1',
          userImagePath: 'img2.jpg',
          createdAt: new Date().toISOString(),
        },
      ];

      mockRequestsService.getPendingSentFriendRequestsFromUser.mockResolvedValue(
        mockData,
      );

      return request(app.getHttpServer() as App)
        .get('/requests/sent')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockData);
          expect(
            mockRequestsService.getPendingSentFriendRequestsFromUser,
          ).toHaveBeenCalled();
        });
    });

    it('should return 500 if the service fails', () => {
      mockRequestsService.getPendingSentFriendRequestsFromUser.mockRejectedValue(
        new Error(),
      );

      return request(app.getHttpServer() as App)
        .get('/requests/sent')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
