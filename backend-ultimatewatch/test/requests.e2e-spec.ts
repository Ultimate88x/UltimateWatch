/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
  ExecutionContext,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RequestsService } from 'src/requests/requests.service';
import { App } from 'supertest/types';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { SeedService } from 'src/common/seed/seed.service';

describe('RequestsController (e2e)', () => {
  let app: INestApplication;

  const mockRequestsService = {
    createFriendRequest: jest.fn(),
    getPendingReceivedFriendRequestsFromUser: jest.fn(),
    getPendingSentFriendRequestsFromUser: jest.fn(),
    resolveFriendRequest: jest.fn(),
    getFriendsFromUser: jest.fn(),
    deleteFriend: jest.fn(),
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
      .overrideProvider(RequestsService)
      .useValue(mockRequestsService)
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

  describe('/requests/create/friend-request (POST)', () => {
    const validBody = { receiverId: 2 };

    it('should return 201 and success message when request is valid', () => {
      mockRequestsService.createFriendRequest.mockResolvedValue({ id: 10 });

      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send(validBody)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.message).toBe('Request sent successfully!');
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

  describe('/requests/friend-request/received (GET)', () => {
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
        .get('/requests/friend-request/received')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockData);
          expect(
            mockRequestsService.getPendingReceivedFriendRequestsFromUser,
          ).toHaveBeenCalledWith(1, 1, 10);
        });
    });

    it('should return 500 if the service fails', () => {
      mockRequestsService.getPendingReceivedFriendRequestsFromUser.mockRejectedValue(
        new Error(),
      );

      return request(app.getHttpServer() as App)
        .get('/requests/friend-request/received')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/requests/friend-request/sent (GET)', () => {
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
        .get('/requests/friend-request/sent')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockData);
          expect(
            mockRequestsService.getPendingSentFriendRequestsFromUser,
          ).toHaveBeenCalledWith(1, 1, 10);
        });
    });

    it('should return 500 if the service fails', () => {
      mockRequestsService.getPendingSentFriendRequestsFromUser.mockRejectedValue(
        new Error(),
      );

      return request(app.getHttpServer() as App)
        .get('/requests/friend-request/sent')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/requests/friend-request/resolve/:id (PATCH)', () => {
    const requestId = 100;
    const url = `/requests/friend-request/resolve/${requestId}`;

    it('should return 200 and success message when accepted', () => {
      mockRequestsService.resolveFriendRequest.mockResolvedValue(true);

      return request(app.getHttpServer() as App)
        .patch(url)
        .send({ accept: true })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.message).toBe('Request successfully accepted!');
          expect(mockRequestsService.resolveFriendRequest).toHaveBeenCalledWith(
            requestId,
            true,
            1,
          );
        });
    });

    it('should return 200 and success message when rejected', () => {
      mockRequestsService.resolveFriendRequest.mockResolvedValue(false);

      return request(app.getHttpServer() as App)
        .patch(url)
        .send({ accept: false })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.message).toBe('Request successfully rejected!');
          expect(mockRequestsService.resolveFriendRequest).toHaveBeenCalledWith(
            requestId,
            false,
            1,
          );
        });
    });

    it('should return 400 (Bad Request) when "accept" is missing or not a boolean', () => {
      return request(app.getHttpServer() as App)
        .patch(url)
        .send({ accept: 'not_a_boolean' })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContain(
            'The accept field must be a boolean value (true/false)',
          );
        });
    });

    it('should return 400 if the service throws a BadRequestException', () => {
      const forbiddenMsg = 'You are not authorized to resolve this request';
      mockRequestsService.resolveFriendRequest.mockRejectedValue(
        new BadRequestException(forbiddenMsg),
      );

      return request(app.getHttpServer() as App)
        .patch(url)
        .send({ accept: true })
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toBe(forbiddenMsg);
        });
    });
  });

  describe('/requests/friends (GET)', () => {
    it('should return 200 and a paginated list of friends', () => {
      const mockFriendsData = {
        data: [
          {
            id: 101,
            username: 'friend_user',
            userImagePath: 'avatar.png',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        lastPage: 1,
      };

      mockRequestsService.getFriendsFromUser.mockResolvedValue(mockFriendsData);

      return request(app.getHttpServer() as App)
        .get('/requests/friends')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockFriendsData);
          expect(mockRequestsService.getFriendsFromUser).toHaveBeenCalledWith(
            1,
            1,
            10,
          );
        });
    });

    it('should return 200 with default pagination if no queries are provided', () => {
      mockRequestsService.getFriendsFromUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      return request(app.getHttpServer() as App)
        .get('/requests/friends')
        .expect(HttpStatus.OK)
        .expect(() => {
          expect(mockRequestsService.getFriendsFromUser).toHaveBeenCalledWith(
            1,
            1,
            10,
          );
        });
    });

    it('should return 500 if the service fails', () => {
      mockRequestsService.getFriendsFromUser.mockRejectedValue(
        new Error('DB Error'),
      );

      return request(app.getHttpServer() as App)
        .get('/requests/friends')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/requests/friend/:username (DELETE)', () => {
    const username = 'pepito';
    const url = `/requests/friend/${username}`;

    it('should return 200 and success message when friend is deleted', () => {
      mockRequestsService.deleteFriend.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .delete(url)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.message).toBe('Successfully removed!');
          expect(mockRequestsService.deleteFriend).toHaveBeenCalledWith(
            username,
            1,
          );
        });
    });

    it('should return 404 if the service throws ResourceNotFoundException', () => {
      mockRequestsService.deleteFriend.mockRejectedValue(
        new ResourceNotFoundException(
          'Friend Request',
          'USER_USERNAME, USER_ID',
          `${username}, 1`,
        ),
      );

      return request(app.getHttpServer() as App)
        .delete(url)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toBe(
            `Friend Request with USER_USERNAME, USER_ID = ${username}, 1 not found`,
          );
        });
    });

    it('should return 500 if the service fails unexpectedly', () => {
      mockRequestsService.deleteFriend.mockRejectedValue(new Error('DB Error'));

      return request(app.getHttpServer() as App)
        .delete(url)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
