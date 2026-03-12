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
    await userRepository.delete({ username: 'testuser' });
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

  it('/auth/profile (GET) - Should return 200 and user data with valid token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@profile.com',
        password: 'password123',
        imagePath:
          'https://ui-avatars.com/api/?name=testuser&background=random',
      })
      .expect(HttpStatus.CREATED);

    const token = loginResponse.body.accessToken;

    const profileResponse = await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(profileResponse.body).toHaveProperty('username', 'testuser');
    expect(profileResponse.body).not.toHaveProperty('password');
  });

  it('/auth/profile (GET) - Should return 401 without token', () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/auth/signup (POST) - Should register a new user and return token', () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .field('username', 'newuser_e2e')
      .field('email', 'e2e@test.com')
      .field('password', 'password123')
      .field('imagePath', 'https://placeholder.com/image.png')
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.username).toBe('newuser_e2e');
      });
  });

  describe('Password Recovery (e2e)', () => {
    const recoveryEmail = 'admin@watch.com';
    let resetToken: string;

    it('/auth/forgot-password (POST) - Should return success message if email exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: recoveryEmail })
        .expect(HttpStatus.CREATED);

      expect(response.body.message).toContain('recovery email has been sent');
    });

    it('/auth/reset-password (POST) - Should reset password with a valid token', async () => {
      const userRepository = app.get(getRepositoryToken(User));
      const user = await userRepository.findOne({
        where: { email: recoveryEmail },
        select: ['id', 'resetToken', 'username'],
      });
      resetToken = user?.resetToken;

      expect(resetToken).toBeDefined();

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'new_secure_password_123',
        })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'admin',
          password: 'new_secure_password_123',
        })
        .expect(HttpStatus.OK);
    });

    it('/auth/reset-password (POST) - Should return 404 (ResourceNotFound) with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: 'token-que-no-existe-en-db',
          newPassword: 'somePassword123',
        })
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toContain('User with RESET_TOKEN');
        });
    });

    it('/auth/reset-password (POST) - Should return 401 with empty token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: '',
          newPassword: 'somePassword123',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
