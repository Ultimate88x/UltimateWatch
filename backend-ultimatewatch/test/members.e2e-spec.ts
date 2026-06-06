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
import { MembersService } from 'src/members/members.service';
import { SeedService } from 'src/common/seed/seed.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { App } from 'supertest/types';
import { MemberRole } from 'src/common/enums/member.role.enum';

describe('MembersController (e2e)', () => {
  let app: INestApplication;

  const mockMembersService = {
    getFromEvent: jest.fn(),
    retrieveByUserIdAndEventId: jest.fn(),
    kickMemberFromEvent: jest.fn(),
    updateMemberRole: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
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
      .overrideProvider(MembersService)
      .useValue(mockMembersService)
      .overrideProvider(EventEmitter2)
      .useValue(mockEventEmitter)
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

  describe('/members/event/:id (GET)', () => {
    it('should return 200 and member list', () => {
      const mockResponse = { data: [], total: 0 };
      mockMembersService.getFromEvent.mockResolvedValue(mockResponse);

      return request(app.getHttpServer() as App)
        .get('/members/event/5')
        .expect(HttpStatus.OK)
        .expect(mockResponse);
    });
  });

  describe('/members/kick (POST)', () => {
    it('should return 201 and kick member', () => {
      const dto = { eventId: 5, kickedUserId: 2 };
      mockMembersService.kickMemberFromEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .post('/members/kick')
        .send(dto)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body).toEqual({ message: 'Member kicked successfully' });
          expect(mockEventEmitter.emit).toHaveBeenCalledWith('member.kicked', {
            kickMemberDto: dto,
          });
        });
    });
  });

  describe('/members/update-role (PATCH)', () => {
    it('should return 200 and update role', () => {
      const dto = { eventId: 5, targetUserId: 2, role: MemberRole.OWNER };
      mockMembersService.updateMemberRole.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .patch('/members/update-role')
        .send(dto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({
            message: 'Member role changed successfully',
          });
          expect(mockEventEmitter.emit).toHaveBeenCalledWith(
            'member.role-updated',
            { updateMemberRoleDto: dto },
          );
        });
    });
  });
});
