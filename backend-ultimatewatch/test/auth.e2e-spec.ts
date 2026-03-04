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

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const userRepository = moduleFixture.get(getRepositoryToken(User));
    await userRepository.delete({ username: 'newuser_e2e' });
  });

  it('/auth/login (POST) - Should login admin user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: '123456',
      })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.username).toBe('admin');
      });
  });

  it('/auth/profile (GET) - Should return 401 without token', () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/auth/signup (POST) - Should register a new user and return token', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'newuser_e2e',
        email: 'e2e@test.com',
        password: 'password123',
      })
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.username).toBe('newuser_e2e');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
