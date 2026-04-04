import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { CreateFriendRequestDto } from './dto/create-friend-request-dto';

describe('RequestsController', () => {
  let controller: RequestsController;

  const mockRequestsService = {
    createFriendRequest: jest.fn(),
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
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createFriendRequest', () => {
    const dto: CreateFriendRequestDto = {
      senderId: 1,
      receiverId: 2,
    };

    it('should call the service and return a success message', async () => {
      mockRequestsService.createFriendRequest.mockResolvedValue({
        id: 10,
        ...dto,
      });

      const result = await controller.createFriendRequest(dto);

      expect(mockRequestsService.createFriendRequest).toHaveBeenCalledWith(dto);

      expect(result).toEqual({
        message: 'Friend request sent successfully',
      });
    });

    it('should propagate errors from the service (e.g., BadRequestException)', async () => {
      const errorMessage = 'You cannot send a friend request to yourself';

      mockRequestsService.createFriendRequest.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.createFriendRequest(dto)).rejects.toThrow(
        errorMessage,
      );

      expect(mockRequestsService.createFriendRequest).toHaveBeenCalledWith(dto);
    });

    it('should propagate unexpected service errors', async () => {
      mockRequestsService.createFriendRequest.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(controller.createFriendRequest(dto)).rejects.toThrow(
        'Unexpected error',
      );
    });
  });
});
