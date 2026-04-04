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

describe('RequestsController (e2e)', () => {
  let app: INestApplication;

  const mockRequestsService = {
    createFriendRequest: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RequestsService)
      .useValue(mockRequestsService)
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
    const validBody = {
      senderId: 1,
      receiverId: 2,
    };

    it('should return 201 and success message when request is valid', () => {
      mockRequestsService.createFriendRequest.mockResolvedValue({ id: 10 });

      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send(validBody)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.message).toBe('Friend request sent successfully');
          expect(mockRequestsService.createFriendRequest).toHaveBeenCalled();
        });
    });

    it('should return 400 if validation fails (e.g., same IDs)', () => {
      const invalidBody = {
        senderId: 5,
        receiverId: 5,
      };

      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send(invalidBody)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContainEqual(
            expect.stringContaining('Receiver cannot be the same as Sender'),
          );
        });
    });

    it('should return 400 if the service throws a BadRequestException', () => {
      const errorMsg = 'Users are already friends';
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

    it('should return 400 if required fields are missing', () => {
      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send({ senderId: 1 }) // falta receiverId
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.error).toBe('Bad Request');
        });
    });

    it('should return 400 if fields are not numbers', () => {
      return request(app.getHttpServer() as App)
        .post('/requests/create/friend-request')
        .send({ senderId: 'one', receiverId: 2 })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
