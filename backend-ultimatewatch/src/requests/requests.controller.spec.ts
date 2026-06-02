/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ResolveRequestDto } from './dto/resolve-request-dto';

describe('RequestsController', () => {
  let controller: RequestsController;
  let service: RequestsService;

  const mockRequestsService = {
    createFriendRequest: jest.fn(),
    getPendingReceivedFriendRequestsFromUser: jest.fn(),
    getPendingSentFriendRequestsFromUser: jest.fn(),
    resolveFriendRequest: jest.fn(),
    getFriendsFromUser: jest.fn(),
    deleteFriend: jest.fn(),
    getPendingReceivedEventInvitationsFromUser: jest.fn(),
    findActiveEventAccessRequestToEventId: jest.fn(),
    deleteEventInviteRequest: jest.fn(),
    deleteAccessRequestToEvent: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<RequestsController>(RequestsController);
    service = module.get<RequestsService>(RequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createFriendRequest', () => {
    const senderId = 1;
    const receiverId = 2;

    it('should call the service and return a success message', async () => {
      mockRequestsService.createFriendRequest.mockResolvedValue({
        id: 10,
        senderId,
        receiverId,
      });

      const result = await controller.createFriendRequest(senderId, receiverId);

      expect(mockRequestsService.createFriendRequest).toHaveBeenCalledWith(
        senderId,
        receiverId,
      );

      expect(result).toEqual({
        message: 'Request sent successfully!',
      });
    });

    it('should propagate errors from the service (e.g., BadRequestException)', async () => {
      const errorMessage = 'You cannot send a friend request to yourself';

      mockRequestsService.createFriendRequest.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.createFriendRequest(senderId, receiverId),
      ).rejects.toThrow(errorMessage);

      expect(mockRequestsService.createFriendRequest).toHaveBeenCalledWith(
        senderId,
        receiverId,
      );
    });
  });

  describe('findPendingReceivedFriendRequests', () => {
    const userId = 1;
    const page = 2;
    const limit = 5;
    const mockData = [
      {
        id: 10,
        username: 'sender1',
        userImagePath: 'path1',
        createdAt: '2026-04-04',
      },
    ];

    it('should return pending received requests for the user with pagination', async () => {
      mockRequestsService.getPendingReceivedFriendRequestsFromUser.mockResolvedValue(
        mockData,
      );

      const result = await controller.findPendingReceivedFriendRequests(
        userId,
        page,
        limit,
      );

      expect(
        mockRequestsService.getPendingReceivedFriendRequestsFromUser,
      ).toHaveBeenCalledWith(userId, page, limit);

      expect(result).toEqual(mockData);
    });

    it('should use default values if pagination parameters are not provided', async () => {
      mockRequestsService.getPendingReceivedFriendRequestsFromUser.mockResolvedValue(
        mockData,
      );

      await controller.findPendingReceivedFriendRequests(userId);

      expect(
        mockRequestsService.getPendingReceivedFriendRequestsFromUser,
      ).toHaveBeenCalledWith(userId, 1, 10);
    });

    it('should propagate service errors', async () => {
      mockRequestsService.getPendingReceivedFriendRequestsFromUser.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.findPendingReceivedFriendRequests(userId, page, limit),
      ).rejects.toThrow('Service error');
    });
  });

  describe('findPendingSentFriendRequests', () => {
    const userId = 1;
    const page = 1;
    const limit = 20;
    const mockData = [
      {
        id: 11,
        username: 'receiver1',
        userImagePath: 'path2',
        createdAt: '2026-04-04',
      },
    ];

    it('should return pending sent requests for the user with pagination', async () => {
      mockRequestsService.getPendingSentFriendRequestsFromUser.mockResolvedValue(
        mockData,
      );

      const result = await controller.findPendingSentFriendRequests(
        userId,
        page,
        limit,
      );

      expect(
        mockRequestsService.getPendingSentFriendRequestsFromUser,
      ).toHaveBeenCalledWith(userId, page, limit);

      expect(result).toEqual(mockData);
    });

    it('should propagate service errors', async () => {
      mockRequestsService.getPendingSentFriendRequestsFromUser.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(
        controller.findPendingSentFriendRequests(userId, 1, 10),
      ).rejects.toThrow('Service error');
    });
  });

  describe('resolveFriendRequest', () => {
    const userId = 1;
    const requestId = 100;

    it('should call service.resolveFriendRequest with correct parameters', async () => {
      const resolveDto = { accept: true } as ResolveRequestDto;
      mockRequestsService.resolveFriendRequest.mockResolvedValue(true);

      const result = await controller.resolveFriendRequest(
        userId,
        requestId,
        resolveDto,
      );

      expect(mockRequestsService.resolveFriendRequest).toHaveBeenCalledWith(
        requestId,
        resolveDto.accept,
        userId,
      );

      expect(result).toEqual({
        message: 'Request successfully accepted!',
      });
    });

    it('should return false when the request is rejected', async () => {
      const rejectDto = { accept: false } as ResolveRequestDto;
      mockRequestsService.resolveFriendRequest.mockResolvedValue(false);

      const result = await controller.resolveFriendRequest(
        userId,
        requestId,
        rejectDto,
      );

      expect(mockRequestsService.resolveFriendRequest).toHaveBeenCalledWith(
        requestId,
        false,
        userId,
      );

      expect(result).toEqual({
        message: 'Request successfully rejected!',
      });
    });

    it('should propagate service errors (e.g., ForbiddenException)', async () => {
      const resolveDto = { accept: true } as ResolveRequestDto;
      mockRequestsService.resolveFriendRequest.mockRejectedValue(
        new Error('You are not authorized to resolve this request'),
      );

      await expect(
        controller.resolveFriendRequest(userId, requestId, resolveDto),
      ).rejects.toThrow('You are not authorized to resolve this request');
    });
  });

  describe('findFriendsFromUser', () => {
    const userId = 1;
    const page = 1;
    const limit = 10;
    const mockFriendsResponse = {
      data: [
        {
          id: 50,
          username: 'friend1',
          userImagePath: 'img1.jpg',
          createdAt: '2026-04-04T12:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      lastPage: 1,
    };

    it('should return the list of friends with pagination', async () => {
      mockRequestsService.getFriendsFromUser.mockResolvedValue(
        mockFriendsResponse,
      );

      const result = await controller.findFriendsFromUser(userId, page, limit);

      expect(mockRequestsService.getFriendsFromUser).toHaveBeenCalledWith(
        userId,
        page,
        limit,
      );
      expect(result).toEqual(mockFriendsResponse);
    });

    it('should correctly transform string query params to numbers', async () => {
      mockRequestsService.getFriendsFromUser.mockResolvedValue(
        mockFriendsResponse,
      );

      await controller.findFriendsFromUser(userId, 2, 5);

      expect(mockRequestsService.getFriendsFromUser).toHaveBeenCalledWith(
        userId,
        2,
        5,
      );
    });

    it('should use default values when parameters are not provided', async () => {
      mockRequestsService.getFriendsFromUser.mockResolvedValue(
        mockFriendsResponse,
      );

      await controller.findFriendsFromUser(userId);

      expect(mockRequestsService.getFriendsFromUser).toHaveBeenCalledWith(
        userId,
        1,
        10,
      );
    });

    it('should propagate service errors', async () => {
      mockRequestsService.getFriendsFromUser.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.findFriendsFromUser(userId, page, limit),
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteFriend', () => {
    const userId = 1;
    const username = 'friendToDelete';

    it('should call service.deleteFriend and return a success message', async () => {
      mockRequestsService.deleteFriend.mockResolvedValue(undefined);

      const result = await controller.deleteFriend(userId, username);

      expect(mockRequestsService.deleteFriend).toHaveBeenCalledWith(
        username,
        userId,
      );

      expect(result).toEqual({
        message: 'Successfully removed!',
      });
    });

    it('should propagate service errors', async () => {
      const errorMessage = 'Friend Request not found';
      mockRequestsService.deleteFriend.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.deleteFriend(userId, username)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('findPendingReceivedEventInvitationsFromUser', () => {
    const userId = 1;
    const page = 1;
    const limit = 10;
    const mockInvitationsResponse = {
      data: [{ id: 5, eventId: 20, senderId: 2 }],
      total: 1,
      page: 1,
      lastPage: 1,
    };

    it('should return received event invitations with pagination number casting', async () => {
      mockRequestsService.getPendingReceivedEventInvitationsFromUser.mockResolvedValue(
        mockInvitationsResponse,
      );

      const result =
        await controller.findPendingReceivedEventInvitationsFromUser(
          userId,
          page,
          limit,
        );

      expect(
        service.getPendingReceivedEventInvitationsFromUser,
      ).toHaveBeenCalledWith(userId, page, limit);
      expect(result).toEqual(mockInvitationsResponse);
    });

    it('should use default values if pagination params are omitted', async () => {
      mockRequestsService.getPendingReceivedEventInvitationsFromUser.mockResolvedValue(
        mockInvitationsResponse,
      );

      await controller.findPendingReceivedEventInvitationsFromUser(userId);

      expect(
        service.getPendingReceivedEventInvitationsFromUser,
      ).toHaveBeenCalledWith(userId, 1, 10);
    });
  });

  describe('findActiveEventAccessRequestToEventId', () => {
    const userId = 1;
    const eventIdParam = '20';
    const numericEventId = 20;

    it('should return request id or null when calling findActiveEventAccessRequestToEventId', async () => {
      mockRequestsService.findActiveEventAccessRequestToEventId.mockResolvedValue(
        99,
      );

      const result = await controller.findActiveEventAccessRequestToEventId(
        userId,
        eventIdParam,
      );

      expect(
        service.findActiveEventAccessRequestToEventId,
      ).toHaveBeenCalledWith(userId, numericEventId);
      expect(result).toBe(99);
    });
  });

  describe('deleteEventInviteRequest', () => {
    const userId = 1;
    const eventIdParam = '20';
    const otherUserIdParam = '30';

    it('should successfully delete event invite request with numeric conversion', async () => {
      mockRequestsService.deleteEventInviteRequest.mockResolvedValue(undefined);

      const result = await controller.deleteEventInviteRequest(
        userId,
        eventIdParam,
        otherUserIdParam,
      );

      expect(service.deleteEventInviteRequest).toHaveBeenCalledWith(
        userId,
        30,
        20,
      );
      expect(result).toEqual({ message: 'Successfully deleted!' });
    });
  });

  describe('deleteAccessRequestToEvent', () => {
    const userId = 1;
    const requestIdParam = '45';

    it('should successfully delete or dismiss access request', async () => {
      mockRequestsService.deleteAccessRequestToEvent.mockResolvedValue(
        undefined,
      );

      const result = await controller.deleteAccessRequestToEvent(
        userId,
        requestIdParam,
      );

      expect(service.deleteAccessRequestToEvent).toHaveBeenCalledWith(
        userId,
        45,
      );
      expect(result).toEqual({ message: 'Request successfully dismissed!' });
    });
  });
});
