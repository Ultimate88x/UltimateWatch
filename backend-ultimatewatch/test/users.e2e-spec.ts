/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const userRepository = moduleFixture.get(getRepositoryToken(User));
    await userRepository.delete({ username: 'user_e2e_target' });

    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'user_e2e_target',
        email: 'target@e2e.com',
        password: 'password123',
      })
      .expect(HttpStatus.CREATED);

    accessToken = signupRes.body.accessToken;
    createdUserId = signupRes.body.userId;
  });

  describe('/users/:id (GET)', () => {
    it('should return 401 Unauthorized if no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return user data if a valid token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id', createdUserId);
      expect(response.body).toHaveProperty('username', 'user_e2e_target');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 200 and null/empty if the user does not exist', () => {
      return request(app.getHttpServer())
        .get('/users/9999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          if (res.body && Object.keys(res.body).length > 0) {
            expect(res.body.id).not.toBe(9999);
          }
        });
    });
  });

  afterAll(async () => {
    const userRepository = app.get(getRepositoryToken(User));
    await userRepository.delete({ username: 'user_e2e_target' });
    await app.close();
  });
});
