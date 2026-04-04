import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { AuthGuard } from 'src/common/guards/auth.guard';

describe('RequestsController', () => {
  let controller: RequestsController;

  const mockRequestsService = {
    createFriendRequest: jest.fn(),
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
});
