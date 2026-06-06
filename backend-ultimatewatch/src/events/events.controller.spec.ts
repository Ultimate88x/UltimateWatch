/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventType } from 'src/common/enums/event.type.enum';
import { EventVisibility } from 'src/common/enums/event.visibility.enum';
import { MediaType } from 'src/common/enums/media.type.enum';

describe('EventsController', () => {
  let controller: EventsController;
  let service: jest.Mocked<EventsService>;

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

  const mockListEventResponse = {
    data: [
      {
        id: 1,
        name: 'Test Event',
        eventDate: new Date(),
        type: EventType.STANDARD,
        visibility: EventVisibility.PUBLIC,
        status: EventStatus.WAITING,
        creatorName: 'testuser',
        creatorImagePath: 'http://image.com',
        mediaTitles: 'Movie A',
        mainImagePath: 'http://image.com',
        currentMembers: 2,
        maxMembers: 10,
      },
    ],
    total: 1,
    page: 1,
    lastPage: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: mockEventsService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get(EventsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAvailableEvents', () => {
    it('should call service.getEventsWithoutUser with correct params and return result', async () => {
      mockEventsService.getEventsWithoutUser.mockResolvedValue(
        mockListEventResponse,
      );

      const result = await controller.findAvailableEvents(1, 1, 12);

      expect(service.getEventsWithoutUser).toHaveBeenCalledWith(1, 1, 12);
      expect(result).toEqual(mockListEventResponse);
    });

    it('should use default page and limit if not provided', async () => {
      mockEventsService.getEventsWithoutUser.mockResolvedValue(
        mockListEventResponse,
      );

      await controller.findAvailableEvents(1);

      expect(service.getEventsWithoutUser).toHaveBeenCalledWith(1, 1, 12);
    });
  });

  describe('findJoinedEvents', () => {
    it('should call service.getJoinedEventsByUser and return result', async () => {
      mockEventsService.getJoinedEventsByUser.mockResolvedValue(
        mockListEventResponse,
      );

      const result = await controller.findJoinedEvents(1, 2, 10);

      expect(service.getJoinedEventsByUser).toHaveBeenCalledWith(1, 2, 10);
      expect(result).toEqual(mockListEventResponse);
    });

    it('should use default page and limit if not provided', async () => {
      mockEventsService.getJoinedEventsByUser.mockResolvedValue(
        mockListEventResponse,
      );

      await controller.findJoinedEvents(1);

      expect(service.getJoinedEventsByUser).toHaveBeenCalledWith(1, 1, 12);
    });
  });

  describe('findCreatedEvents', () => {
    it('should call service.getCreatedEventsByUser and return result', async () => {
      mockEventsService.getCreatedEventsByUser.mockResolvedValue(
        mockListEventResponse,
      );

      const result = await controller.findCreatedEvents(1, 1, 12);

      expect(service.getCreatedEventsByUser).toHaveBeenCalledWith(1, 1, 12);
      expect(result).toEqual(mockListEventResponse);
    });
  });

  describe('findVisibleCreatedEvents', () => {
    it('should call service.getVisibleCreatedEventsByUser with correct userId', async () => {
      mockEventsService.getVisibleCreatedEventsByUser.mockResolvedValue(
        mockListEventResponse,
      );

      const result = await controller.findVisibleCreatedEvents(5, 1, 12);

      expect(service.getVisibleCreatedEventsByUser).toHaveBeenCalledWith(
        5,
        1,
        12,
      );
      expect(result).toEqual(mockListEventResponse);
    });
  });

  describe('getEventVotingResults', () => {
    it('should call service.getFormattedResultsByEvent with limited=false and return results', async () => {
      const mockResults = [{ id: 1, title: 'Movie A', count: 5 }];
      mockEventsService.getFormattedResultsByEvent.mockResolvedValue(
        mockResults,
      );

      const result = await controller.getEventVotingResults(10);

      expect(service.getFormattedResultsByEvent).toHaveBeenCalledWith(
        10,
        false,
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe('findEvent', () => {
    it('should call service.getEventDetailedInformation and return event info', async () => {
      const mockEventDetail = {
        id: 1,
        name: 'Test',
        status: EventStatus.WAITING,
        type: EventType.STANDARD,
      };
      mockEventsService.getEventDetailedInformation.mockResolvedValue(
        mockEventDetail,
      );

      const result = await controller.findEvent('1');

      expect(service.getEventDetailedInformation).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEventDetail);
    });
  });

  describe('findMediaEventsFromEvent', () => {
    it('should call service.getMediasEventFromEvent and return media list', async () => {
      const mockMedia = [{ id: 1, title: 'Movie A', type: MediaType.MOVIE }];
      mockEventsService.getMediasEventFromEvent.mockResolvedValue(mockMedia);

      const result = await controller.findMediaEventsFromEvent('1');

      expect(service.getMediasEventFromEvent).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMedia);
    });
  });

  describe('getEventStatus', () => {
    it('should call service.getEventStatus with userId and id', async () => {
      mockEventsService.getEventStatus.mockResolvedValue(EventStatus.WAITING);

      const result = await controller.getEventStatus(1, '5');

      expect(service.getEventStatus).toHaveBeenCalledWith(1, 5);
      expect(result).toBe(EventStatus.WAITING);
    });
  });

  describe('findEventMediaForEventRoom', () => {
    it('should call service.getEventMediaForEventRoom and return media list', async () => {
      const mockRoomMedia = [{ id: 1, order: 0, status: 'pending' }];
      mockEventsService.getEventMediaForEventRoom.mockResolvedValue(
        mockRoomMedia,
      );

      const result = await controller.findEventMediaForEventRoom('1');

      expect(service.getEventMediaForEventRoom).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockRoomMedia);
    });
  });

  describe('createEvent', () => {
    it('should call service.handleCreateStandardEvent and return success message', async () => {
      mockEventsService.handleCreateStandardEvent.mockResolvedValue(undefined);

      const dto = { name: 'Test', mediaIds: [1], eventDate: new Date() } as any;
      const result = await controller.createEvent(1, dto);

      expect(service.handleCreateStandardEvent).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual({ message: 'Event succesfully created!' });
    });
  });

  describe('createVotingEvent', () => {
    it('should call service.handleCreateVotingEvent and return success message', async () => {
      mockEventsService.handleCreateVotingEvent.mockResolvedValue(undefined);

      const dto = {
        name: 'Voting Event',
        proposedMediaIds: [1],
        eventDate: new Date(),
      } as any;
      const result = await controller.createVotingEvent(1, dto);

      expect(service.handleCreateVotingEvent).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual({ message: 'Event succesfully created!' });
    });
  });

  describe('joinEvent', () => {
    it('should call service.joinEvent and return success message', async () => {
      mockEventsService.joinEvent.mockResolvedValue(undefined);

      const result = await controller.joinEvent(1, '5');

      expect(service.joinEvent).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual({ message: 'Succesfully joined the event!' });
    });
  });

  describe('leaveEvent', () => {
    it('should call service.leaveEvent and return success message', async () => {
      mockEventsService.leaveEvent.mockResolvedValue(undefined);

      const result = await controller.leaveEvent(1, '5');

      expect(service.leaveEvent).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual({ message: 'Succesfully left the event!' });
    });
  });

  describe('addMedia', () => {
    it('should call service.addMediaToStandardEvent and return success message', async () => {
      mockEventsService.addMediaToStandardEvent.mockResolvedValue(undefined);

      const result = await controller.addMedia(1, '10', '200');

      expect(service.addMediaToStandardEvent).toHaveBeenCalledWith(1, 10, 200);
      expect(result).toEqual({ message: 'Media succesfully added!' });
    });
  });

  describe('suggestMedia', () => {
    it('should call service.addProposedMediaToVotingEvent and return success message', async () => {
      mockEventsService.addProposedMediaToVotingEvent.mockResolvedValue(
        undefined,
      );

      const result = await controller.suggestMedia('10', '200');

      expect(service.addProposedMediaToVotingEvent).toHaveBeenCalledWith(
        10,
        200,
      );
      expect(result).toEqual({ message: 'Media succesfully suggested!' });
    });
  });

  describe('removeMediaFromEvent', () => {
    it('should call service.deleteMediaFromEvent and return success message', async () => {
      mockEventsService.deleteMediaFromEvent.mockResolvedValue(undefined);

      const result = await controller.removeMediaFromEvent(1, '10', '200');

      expect(service.deleteMediaFromEvent).toHaveBeenCalledWith(1, 10, 200);
      expect(result).toEqual({ message: 'Media succesfully removed!' });
    });
  });

  describe('checkEventVisibility', () => {
    it('should return true if event is visible to user', async () => {
      mockEventsService.checkCanSeeEvent.mockResolvedValue(true);

      const result = await controller.checkEventVisibility(1, '10');

      expect(service.checkCanSeeEvent).toHaveBeenCalledWith(1, 10);
      expect(result).toBe(true);
    });

    it('should return false if event is not visible to user', async () => {
      mockEventsService.checkCanSeeEvent.mockResolvedValue(false);

      const result = await controller.checkEventVisibility(1, '10');

      expect(result).toBe(false);
    });
  });

  describe('inviteUserToEvent', () => {
    it('should call service.inviteUserToEvent and return success message', async () => {
      mockEventsService.inviteUserToEvent.mockResolvedValue(undefined);

      const dto = { receiverId: 2, eventId: 10 } as any;
      const result = await controller.inviteUserToEvent(1, dto);

      expect(service.inviteUserToEvent).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({
        message: 'User invited to event successfully!',
      });
    });
  });

  describe('requestAccessToEvent', () => {
    it('should call service.requestAccessToEvent and return success message', async () => {
      mockEventsService.requestAccessToEvent.mockResolvedValue(undefined);

      const result = await controller.requestAccessToEvent(1, '10');

      expect(service.requestAccessToEvent).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({
        message: 'Access to event requested successfully!',
      });
    });
  });

  describe('getFriendsToInvite', () => {
    it('should call service.getFriendsToInvite and return friend list', async () => {
      const mockFriends = { data: [], total: 0, page: 1, lastPage: 1 };
      mockEventsService.getFriendsToInvite.mockResolvedValue(mockFriends);

      const result = await controller.getFriendsToInvite(1, '10', 1, 10);

      expect(service.getFriendsToInvite).toHaveBeenCalledWith(1, 10, 1, 10);
      expect(result).toEqual(mockFriends);
    });
  });

  describe('resolveEventInviteRequest', () => {
    it('should return accepted message when accept is true', async () => {
      mockEventsService.resolveEventInviteRequest.mockResolvedValue(true);

      const result = await controller.resolveEventInviteRequest(1, 5, {
        accept: true,
      });

      expect(service.resolveEventInviteRequest).toHaveBeenCalledWith(
        1,
        5,
        true,
      );
      expect(result).toEqual({ message: 'Request successfully accepted!' });
    });

    it('should return rejected message when accept is false', async () => {
      mockEventsService.resolveEventInviteRequest.mockResolvedValue(false);

      const result = await controller.resolveEventInviteRequest(1, 5, {
        accept: false,
      });

      expect(service.resolveEventInviteRequest).toHaveBeenCalledWith(
        1,
        5,
        false,
      );
      expect(result).toEqual({ message: 'Request successfully rejected!' });
    });
  });

  describe('resolveEventAccessRequest', () => {
    it('should return accepted message when accept is true', async () => {
      mockEventsService.resolveEventAccessRequest.mockResolvedValue(true);

      const result = await controller.resolveEventAccessRequest(1, 5, {
        accept: true,
      });

      expect(service.resolveEventAccessRequest).toHaveBeenCalledWith(
        1,
        5,
        true,
      );
      expect(result).toEqual({ message: 'Request successfully accepted!' });
    });

    it('should return rejected message when accept is false', async () => {
      mockEventsService.resolveEventAccessRequest.mockResolvedValue(false);

      const result = await controller.resolveEventAccessRequest(1, 5, {
        accept: false,
      });

      expect(result).toEqual({ message: 'Request successfully rejected!' });
    });
  });

  describe('getActiveAccessRequests', () => {
    it('should call service.getActiveAccessRequestsFromEvent and return result', async () => {
      const mockRequests = { data: [], total: 0, page: 1, lastPage: 1 };
      mockEventsService.getActiveAccessRequestsFromEvent.mockResolvedValue(
        mockRequests,
      );

      const result = await controller.getActiveAccessRequests(1, '10', 1, 10);

      expect(service.getActiveAccessRequestsFromEvent).toHaveBeenCalledWith(
        1,
        10,
        1,
        10,
      );
      expect(result).toEqual(mockRequests);
    });
  });

  describe('updateStandardEvent', () => {
    it('should call service.handleUpdateStandardEvent and return success message', async () => {
      mockEventsService.handleUpdateStandardEvent.mockResolvedValue(undefined);

      const dto = { name: 'Updated Event' } as any;
      const result = await controller.updateStandardEvent(1, '10', dto);

      expect(service.handleUpdateStandardEvent).toHaveBeenCalledWith(
        1,
        10,
        dto,
      );
      expect(result).toEqual({ message: 'Event updated succesfully!' });
    });
  });

  describe('updateVotingEvent', () => {
    it('should call service.handleUpdateVotingEvent and return success message', async () => {
      mockEventsService.handleUpdateVotingEvent.mockResolvedValue(undefined);

      const dto = { name: 'Updated Voting Event' } as any;
      const result = await controller.updateVotingEvent(1, '10', dto);

      expect(service.handleUpdateVotingEvent).toHaveBeenCalledWith(1, 10, dto);
      expect(result).toEqual({ message: 'Event updated succesfully!' });
    });
  });

  describe('cancelEvent', () => {
    it('should call service.cancelEvent and return success message', async () => {
      mockEventsService.cancelEvent.mockResolvedValue(undefined);

      const result = await controller.cancelEvent(1, '10');

      expect(service.cancelEvent).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual({ message: 'Event deleted succesfully!' });
    });
  });
});
