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
import { EventsService } from 'src/events/events.service';
import { SeedService } from 'src/common/seed/seed.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { App } from 'supertest/types';
import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventVisibility } from 'src/common/enums/event.visibility.enum';

describe('EventsController (e2e)', () => {
  let app: INestApplication;

  const mockEventsService = {
    getEventsWithoutUser: jest.fn(),
    getJoinedEventsByUser: jest.fn(),
    getCreatedEventsByUser: jest.fn(),
    getVisibleCreatedEventsByUser: jest.fn(),
    getFormattedResultsByEvent: jest.fn(),
    getEventDetailedInformation: jest.fn(),
    getMediasEventFromEvent: jest.fn(),
    getEventStatus: jest.fn(),
    getEventMediaForEventRoom: jest.fn(),
    handleCreateStandardEvent: jest.fn(),
    handleCreateVotingEvent: jest.fn(),
    joinEvent: jest.fn(),
    leaveEvent: jest.fn(),
    addMediaToStandardEvent: jest.fn(),
    addProposedMediaToVotingEvent: jest.fn(),
    deleteMediaFromEvent: jest.fn(),
    checkCanSeeEvent: jest.fn(),
    inviteUserToEvent: jest.fn(),
    requestAccessToEvent: jest.fn(),
    getFriendsToInvite: jest.fn(),
    resolveEventInviteRequest: jest.fn(),
    resolveEventAccessRequest: jest.fn(),
    getActiveAccessRequestsFromEvent: jest.fn(),
    handleUpdateStandardEvent: jest.fn(),
    handleUpdateVotingEvent: jest.fn(),
    cancelEvent: jest.fn(),
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
      .overrideProvider(EventsService)
      .useValue(mockEventsService)
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideProvider(SeedService)
      .useValue({ onApplicationBootstrap: jest.fn(), runSeed: jest.fn() })
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

  describe('/events/available (GET)', () => {
    it('should return 200 and available events', () => {
      mockEventsService.getEventsWithoutUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      return request(app.getHttpServer() as App)
        .get('/events/available')
        .expect(HttpStatus.OK)
        .expect({ data: [], total: 0 });
    });

    it('should pass page and limit query params to the service', async () => {
      mockEventsService.getEventsWithoutUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      await request(app.getHttpServer() as App)
        .get('/events/available?page=2&limit=6')
        .expect(HttpStatus.OK);

      expect(mockEventsService.getEventsWithoutUser).toHaveBeenCalledWith(
        1,
        2,
        6,
      );
    });
  });

  describe('/events/joined (GET)', () => {
    it('should return 200 and joined events', () => {
      mockEventsService.getJoinedEventsByUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      return request(app.getHttpServer() as App)
        .get('/events/joined')
        .expect(HttpStatus.OK)
        .expect({ data: [], total: 0 });
    });
  });

  describe('/events/created (GET)', () => {
    it('should return 200 and created events', () => {
      mockEventsService.getCreatedEventsByUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      return request(app.getHttpServer() as App)
        .get('/events/created')
        .expect(HttpStatus.OK)
        .expect({ data: [], total: 0 });
    });
  });

  describe('/events/created/:userId (GET)', () => {
    it('should return 200 and visible created events for a given user', () => {
      mockEventsService.getVisibleCreatedEventsByUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      return request(app.getHttpServer() as App)
        .get('/events/created/5')
        .expect(HttpStatus.OK)
        .expect({ data: [], total: 0 });
    });
  });

  describe('/events/results/:eventId (GET)', () => {
    it('should return 200 and voting results', () => {
      const mockResults = [{ id: 1, title: 'Movie A', count: 3 }];
      mockEventsService.getFormattedResultsByEvent.mockResolvedValue(
        mockResults,
      );

      return request(app.getHttpServer() as App)
        .get('/events/results/10')
        .expect(HttpStatus.OK)
        .expect(mockResults);
    });

    it('should call service with limited=false', async () => {
      mockEventsService.getFormattedResultsByEvent.mockResolvedValue([]);

      await request(app.getHttpServer() as App).get('/events/results/10');

      expect(mockEventsService.getFormattedResultsByEvent).toHaveBeenCalledWith(
        10,
        false,
      );
    });
  });

  describe('/events/:id (GET)', () => {
    it('should return 200 and event details', () => {
      const mockEvent = { id: 10, name: 'Test Event' };
      mockEventsService.getEventDetailedInformation.mockResolvedValue(
        mockEvent,
      );

      return request(app.getHttpServer() as App)
        .get('/events/10')
        .expect(HttpStatus.OK)
        .expect(mockEvent);
    });
  });

  describe('/events/status/:id (GET)', () => {
    it('should return 200 and event status', () => {
      mockEventsService.getEventStatus.mockResolvedValue(EventStatus.WAITING);

      return request(app.getHttpServer() as App)
        .get('/events/status/10')
        .expect(HttpStatus.OK)
        .expect(EventStatus.WAITING);
    });
  });

  describe('/events/standard (POST)', () => {
    const validDto = {
      name: 'Movie Night',
      description: 'Fun time',
      mediaIds: [1, 2, 3],
      isRecurring: false,
      eventDate: new Date(Date.now() + 3600000).toISOString(),
      maxMembers: 10,
      visibility: EventVisibility.PUBLIC,
    };

    it('should return 201 when standard event is created', () => {
      mockEventsService.handleCreateStandardEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .post('/events/standard')
        .send(validDto)
        .expect(HttpStatus.CREATED)
        .expect({ message: 'Event succesfully created!' });
    });

    it('should return 400 if required fields are missing', () => {
      return request(app.getHttpServer() as App)
        .post('/events/standard')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/events/voting (POST)', () => {
    it('should return 201 when voting event is created', () => {
      mockEventsService.handleCreateVotingEvent.mockResolvedValue(undefined);

      const dto = {
        name: 'Vote Night',
        description: 'Vote for media',
        proposedMediaIds: [1, 2],
        isRecurring: false,
        eventDate: new Date(Date.now() + 3600000).toISOString(),
        votingEndDate: new Date(Date.now() + 1800000).toISOString(),
        maxMembers: 10,
        maxMedia: 3,
        maxVotesPerMember: 2,
        visibility: EventVisibility.PUBLIC,
      };

      return request(app.getHttpServer() as App)
        .post('/events/voting')
        .send(dto)
        .expect(HttpStatus.CREATED)
        .expect({ message: 'Event succesfully created!' });
    });
  });

  describe('/events/join/:id (POST)', () => {
    it('should return 201 when user joins event', () => {
      mockEventsService.joinEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .post('/events/join/5')
        .expect(HttpStatus.CREATED)
        .expect({ message: 'Succesfully joined the event!' });
    });
  });

  describe('/events/leave/:id (POST)', () => {
    it('should return 201 when user leaves event', () => {
      mockEventsService.leaveEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .post('/events/leave/5')
        .expect(HttpStatus.CREATED)
        .expect({ message: 'Succesfully left the event!' });
    });
  });

  describe('/events/add/:eventId/:mediaId (PATCH)', () => {
    it('should return 200 when media is added', () => {
      mockEventsService.addMediaToStandardEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .patch('/events/add/10/200')
        .expect(HttpStatus.OK)
        .expect({ message: 'Media succesfully added!' });
    });

    it('should call service with correct numeric params', async () => {
      mockEventsService.addMediaToStandardEvent.mockResolvedValue(undefined);

      await request(app.getHttpServer() as App).patch('/events/add/10/200');

      expect(mockEventsService.addMediaToStandardEvent).toHaveBeenCalledWith(
        1,
        10,
        200,
      );
    });
  });

  describe('/events/suggest/:eventId/:mediaId (PATCH)', () => {
    it('should return 200 when media is suggested', () => {
      mockEventsService.addProposedMediaToVotingEvent.mockResolvedValue(
        undefined,
      );

      return request(app.getHttpServer() as App)
        .patch('/events/suggest/10/200')
        .expect(HttpStatus.OK)
        .expect({ message: 'Media succesfully suggested!' });
    });
  });

  describe('/events/remove/:eventId/:mediaId (PATCH)', () => {
    it('should return 200 when media is removed', () => {
      mockEventsService.deleteMediaFromEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .patch('/events/remove/10/200')
        .expect(HttpStatus.OK)
        .expect({ message: 'Media succesfully removed!' });
    });
  });

  describe('/events/invite (POST)', () => {
    it('should return 201 when user is invited', () => {
      mockEventsService.inviteUserToEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .post('/events/invite')
        .send({ receiverId: 2, eventId: 10 })
        .expect(HttpStatus.CREATED)
        .expect({ message: 'User invited to event successfully!' });
    });

    it('should return 400 if body is missing required fields', () => {
      return request(app.getHttpServer() as App)
        .post('/events/invite')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/events/request-access/:eventId (POST)', () => {
    it('should return 201 when access is requested', () => {
      mockEventsService.requestAccessToEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .post('/events/request-access/10')
        .expect(HttpStatus.CREATED)
        .expect({ message: 'Access to event requested successfully!' });
    });
  });

  describe('/events/event-invite-request/resolve/:id (PATCH)', () => {
    it('should return 200 with accepted message when accept=true', () => {
      mockEventsService.resolveEventInviteRequest.mockResolvedValue(true);

      return request(app.getHttpServer() as App)
        .patch('/events/event-invite-request/resolve/5')
        .send({ accept: true })
        .expect(HttpStatus.OK)
        .expect({ message: 'Request successfully accepted!' });
    });

    it('should return 200 with rejected message when accept=false', () => {
      mockEventsService.resolveEventInviteRequest.mockResolvedValue(false);

      return request(app.getHttpServer() as App)
        .patch('/events/event-invite-request/resolve/5')
        .send({ accept: false })
        .expect(HttpStatus.OK)
        .expect({ message: 'Request successfully rejected!' });
    });

    it('should return 400 if body is missing accept field', () => {
      return request(app.getHttpServer() as App)
        .patch('/events/event-invite-request/resolve/5')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/events/event-access-request/resolve/:id (PATCH)', () => {
    it('should return 200 with accepted message when accept=true', () => {
      mockEventsService.resolveEventAccessRequest.mockResolvedValue(true);

      return request(app.getHttpServer() as App)
        .patch('/events/event-access-request/resolve/5')
        .send({ accept: true })
        .expect(HttpStatus.OK)
        .expect({ message: 'Request successfully accepted!' });
    });

    it('should return 200 with rejected message when accept=false', () => {
      mockEventsService.resolveEventAccessRequest.mockResolvedValue(false);

      return request(app.getHttpServer() as App)
        .patch('/events/event-access-request/resolve/5')
        .send({ accept: false })
        .expect(HttpStatus.OK)
        .expect({ message: 'Request successfully rejected!' });
    });
  });

  describe('/events/standard/:eventId (PUT)', () => {
    it('should return 200 when standard event is updated', () => {
      mockEventsService.handleUpdateStandardEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .put('/events/standard/10')
        .send({ updateAll: false })
        .expect(HttpStatus.OK)
        .expect({ message: 'Event updated succesfully!' });
    });

    it('should call service with correct params', async () => {
      mockEventsService.handleUpdateStandardEvent.mockResolvedValue(undefined);

      await request(app.getHttpServer() as App)
        .put('/events/standard/10')
        .send({ updateAll: false });

      expect(mockEventsService.handleUpdateStandardEvent).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ updateAll: false }),
      );
    });
  });

  describe('/events/voting/:eventId (PUT)', () => {
    it('should return 200 when voting event is updated', () => {
      mockEventsService.handleUpdateVotingEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .put('/events/voting/10')
        .send({ updateAll: false })
        .expect(HttpStatus.OK)
        .expect({ message: 'Event updated succesfully!' });
    });

    it('should call service with correct params', async () => {
      mockEventsService.handleUpdateVotingEvent.mockResolvedValue(undefined);

      await request(app.getHttpServer() as App)
        .put('/events/voting/10')
        .send({ updateAll: false });

      expect(mockEventsService.handleUpdateVotingEvent).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ updateAll: false }),
      );
    });
  });

  describe('/events/:eventId (DELETE)', () => {
    it('should return 200 when event is deleted', () => {
      mockEventsService.cancelEvent.mockResolvedValue(undefined);

      return request(app.getHttpServer() as App)
        .delete('/events/10')
        .expect(HttpStatus.OK)
        .expect({ message: 'Event deleted succesfully!' });
    });

    it('should call service with correct userId and eventId', async () => {
      mockEventsService.cancelEvent.mockResolvedValue(undefined);

      await request(app.getHttpServer() as App).delete('/events/10');

      expect(mockEventsService.cancelEvent).toHaveBeenCalledWith(1, 10);
    });
  });
});
