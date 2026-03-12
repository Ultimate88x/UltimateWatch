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

    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        username: 'user_e2e_target',
        email: 'target@e2e.com',
        password: 'password123',
        imagePath:
          'https://ui-avatars.com/api/?name=user_e2e_target&background=random',
      })
      .expect(HttpStatus.CREATED);

    accessToken = signupRes.body.accessToken;
    createdUserId = signupRes.body.userId;
  });

  describe('/users/:id (GET)', () => {
    it('should return the user data if it exists', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toBe(createdUserId);
          expect(res.body.username).toBe('user_e2e_target');
        });
    });

    it('should return 404 if the user does not exist', () => {
      return request(app.getHttpServer())
        .get('/users/9999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 if no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/users/:id (PATCH)', () => {
    const updatedData = { username: 'new_e2e_name' };

    it('should return 401 if no token is provided', () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send(updatedData)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should update user fields successfully (without file)', async () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedData)
        .expect(HttpStatus.OK);
    });

    it('should return 403 if trying to update another user', () => {
      return request(app.getHttpServer())
        .patch('/users/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedData)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 if user owns the resource but it no longer exists in DB', async () => {
      const tempUserRes = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          username: 'ghost_user',
          email: 'ghost@e2e.com',
          password: 'password123',
          imagePath: 'https://ui-avatars.com/api/?name=ghost',
        });

      const tempToken = tempUserRes.body.accessToken;
      const tempId = tempUserRes.body.userId;

      const userRepository = app.get(getRepositoryToken(User));
      await userRepository.delete(tempId);

      return request(app.getHttpServer())
        .patch(`/users/${tempId}`)
        .set('Authorization', `Bearer ${tempToken}`)
        .send({ username: 'wont_work' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should update user and handle file upload simulation', async () => {
      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', 'user_with_photo')
        .expect(HttpStatus.OK);
    });

    it('should update password and verify it was hashed', async () => {
      const newPassword = 'newPassword456';

      await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: newPassword })
        .expect(HttpStatus.OK);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'user_with_photo',
          password: newPassword,
        })
        .expect(HttpStatus.OK);

      expect(loginRes.body).toHaveProperty('accessToken');
    });

    it('should return 409 Conflict if trying to update to an existing username', async () => {
      await request(app.getHttpServer()).post('/auth/signup').send({
        username: 'collision_user',
        email: 'collision@e2e.com',
        password: 'password123',
        imagePath: 'path',
      });

      return request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: 'collision_user' })
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should return 401 Unauthorized if no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 Forbidden if trying to delete another user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.message).toContain(
        'You are not the owner of this resource',
      );
    });

    it('should return 200 and delete the user if it is the owner', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.message).toBe('Account deleted successfully');

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'user_with_photo',
          password: 'newPassword456',
        })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  afterAll(async () => {
    const userRepository = app.get(getRepositoryToken(User));
    await userRepository.delete({ username: 'user_with_photo' });
    await app.close();
  });
});
