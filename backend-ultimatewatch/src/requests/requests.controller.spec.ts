import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { AuthGuard } from 'src/common/guards/auth.guard';

describe('RequestsController', () => {
  let controller: RequestsController;

  const mockRequestsService = {
    createFriendRequest: jest.fn(),
    getPendingReceivedFriendRequestsFromUser: jest.fn(),
    getPendingSentFriendRequestsFromUser: jest.fn(),
    resolveFriendRequest: jest.fn(),
    getFriendsFromUser: jest.fn(),
    deleteFriend: jest.fn(),
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
        message: 'Friend request sent successfully!',
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

    it('should propagate unexpected service errors', async () => {
      mockRequestsService.createFriendRequest.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.createFriendRequest(senderId, receiverId),
      ).rejects.toThrow('Unexpected error');
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
    const resolveDto = { accept: true };

    it('should call service.resolveFriendRequest with correct parameters', async () => {
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
        message: 'Friend request succesfully accepted!',
      });
    });

    it('should return false when the request is rejected', async () => {
      const rejectDto = { accept: false };
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
        message: 'Friend request succesfully rejected!',
      });
    });

    it('should propagate service errors (e.g., ForbiddenException)', async () => {
      mockRequestsService.resolveFriendRequest.mockRejectedValue(
        new Error('You are not authorized to resolve this request'),
      );

      await expect(
        controller.resolveFriendRequest(userId, requestId, resolveDto),
      ).rejects.toThrow('You are not authorized to resolve this request');
    });
  });

  describe('findFriendsFromuser', () => {
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
        message: 'Friend deleted succesfully!',
      });
    });

    it('should propagate service errors (e.g., ResourceNotFoundException)', async () => {
      const errorMessage = 'Friend Request not found';
      mockRequestsService.deleteFriend.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.deleteFriend(userId, username)).rejects.toThrow(
        errorMessage,
      );

      expect(mockRequestsService.deleteFriend).toHaveBeenCalledWith(
        username,
        userId,
      );
    });

    it('should propagate unauthorized or forbidden errors', async () => {
      mockRequestsService.deleteFriend.mockRejectedValue(
        new Error('You are not authorized to delete this friend relationship'),
      );

      await expect(controller.deleteFriend(userId, username)).rejects.toThrow(
        'You are not authorized to delete this friend relationship',
      );
    });
  });
});
