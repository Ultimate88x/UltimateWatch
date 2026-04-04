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
});
