import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { BadRequestException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('RequestsService', () => {
  let service: RequestsService;

  const mockUsersService = {
    findById: jest.fn(),
  };

  const createMockRequestRepository = (): MockRepository<Request> => ({
    findOne: jest.fn(),
  });

  const createMockFriendRequestRepository =
    (): MockRepository<FriendRequest> => ({
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(Request),
          useValue: createMockRequestRepository(),
        },
        {
          provide: getRepositoryToken(FriendRequest),
          useValue: createMockFriendRequestRepository(),
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFriendRequest', () => {
    const senderId = 1;
    const receiverId = 2;
    const mockSender = { id: 1, username: 'sender' } as User;
    const mockReceiver = { id: 2, username: 'receiver' } as User;

    it('should create and save a new friend request if users exist', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;
      const mockFriendRequest = {
        id: 10,
        sender: mockSender,
        receiver: mockReceiver,
      } as FriendRequest;

      mockUsersService.findById.mockImplementation((id: number) => {
        if (id === 1) return Promise.resolve(mockSender);
        if (id === 2) return Promise.resolve(mockReceiver);
        return Promise.resolve(null);
      });

      friendRepo.findOne?.mockResolvedValue(null);
      friendRepo.create?.mockReturnValue(mockFriendRequest);
      friendRepo.save?.mockResolvedValue(mockFriendRequest);

      await service.createFriendRequest(senderId, receiverId);

      expect(mockUsersService.findById).toHaveBeenCalledTimes(2);
      expect(friendRepo.create).toHaveBeenCalled();
      expect(friendRepo.save).toHaveBeenCalled();
    });

    it('should propagate error if usersService.findById fails', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;
      friendRepo.findOne?.mockResolvedValue(null);

      mockUsersService.findById.mockRejectedValue(
        new ResourceNotFoundException('User', 'ID', '1'),
      );

      await expect(
        service.createFriendRequest(senderId, receiverId),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('should throw BadRequestException if sender and receiver are the same', async () => {
      await expect(service.createFriendRequest(1, 1)).rejects.toThrow(
        new BadRequestException('You cannot send a friend request to yourself'),
      );
    });
  });

  describe('getRelationStatus', () => {
    it('should return "none" if no request exists', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;
      friendRepo.findOne?.mockResolvedValue(null);

      const status = await service.getRelationStatus(1, 2);
      expect(status).toBe('none');
    });
  });

  describe('getPendingReceivedFriendRequestsFromUser', () => {
    const userId = 1;
    const page = 2;
    const limit = 5;
    const mockUser = { id: userId, username: 'me' } as User;
    const mockSender = {
      id: 2,
      username: 'senderUser',
      imagePath: 'path',
    } as User;

    it('should return a paginated RequestResponseDto', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;
      const mockFriendRequest = {
        id: 10,
        sender: mockSender,
        receiver: mockUser,
        accepted: false,
        createdAt: new Date(),
      } as FriendRequest;

      mockUsersService.findById.mockResolvedValue(mockUser);
      friendRepo.findAndCount?.mockResolvedValue([[mockFriendRequest], 11]);

      const result = await service.getPendingReceivedFriendRequestsFromUser(
        userId,
        page,
        limit,
      );

      expect(friendRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );

      expect(result.data[0].username).toBe(mockSender.username);
      expect(result.total).toBe(11);
      expect(result.lastPage).toBe(3);
    });
  });

  describe('getPendingSentFriendRequestsFromUser', () => {
    const userId = 1;

    it('should return a paginated RequestResponseDto for sent requests', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;
      const mockReceiver = {
        id: 3,
        username: 'receiverUser',
        imagePath: 'path2',
      } as User;
      const mockFriendRequest = {
        id: 11,
        sender: { id: userId },
        receiver: mockReceiver,
        accepted: false,
        createdAt: new Date(),
      } as FriendRequest;

      mockUsersService.findById.mockResolvedValue({ id: userId });
      friendRepo.findAndCount?.mockResolvedValue([[mockFriendRequest], 1]);

      const result = await service.getPendingSentFriendRequestsFromUser(
        userId,
        1,
        10,
      );

      expect(friendRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sender: { id: userId }, accepted: false },
        }),
      );
      expect(result.data[0].username).toBe(mockReceiver.username);
      expect(result.total).toBe(1);
    });

    it('should throw ResourceNotFoundException if user does not exist', async () => {
      mockUsersService.findById.mockRejectedValue(
        new ResourceNotFoundException('User', 'ID', '1'),
      );

      await expect(
        service.getPendingSentFriendRequestsFromUser(1, 1, 10),
      ).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('resolveFriendRequest', () => {
    const requestId = 100;
    const currentUserId = 1;
    const otherUserId = 2;

    it('should throw ForbiddenException if current user is not the receiver', async () => {
      const mockRequest = {
        id: requestId,
        receiver: { id: otherUserId },
      } as FriendRequest;

      jest.spyOn(service, 'findById').mockResolvedValue(mockRequest);

      await expect(
        service.resolveFriendRequest(requestId, true, currentUserId),
      ).rejects.toThrow('You are not authorized to resolve this request');
    });

    it('should throw BadRequestException if request is already accepted', async () => {
      const mockRequest = {
        id: requestId,
        receiver: { id: currentUserId },
        accepted: true,
      } as FriendRequest;

      jest.spyOn(service, 'findById').mockResolvedValue(mockRequest);

      await expect(
        service.resolveFriendRequest(requestId, true, currentUserId),
      ).rejects.toThrow('This request has already been resolved');
    });

    it('should call acceptFriendRequest when accept is true', async () => {
      const mockRequest = {
        id: requestId,
        receiver: { id: currentUserId },
        accepted: false,
      } as FriendRequest;

      jest.spyOn(service, 'findById').mockResolvedValue(mockRequest);
      const acceptSpy = jest
        .spyOn(service, 'acceptFriendRequest')
        .mockResolvedValue(undefined);

      const result = await service.resolveFriendRequest(
        requestId,
        true,
        currentUserId,
      );

      expect(result).toBe(true);
      expect(acceptSpy).toHaveBeenCalledWith(mockRequest);
    });

    it('should call deleteFriendRequest when accept is false', async () => {
      const mockRequest = {
        id: requestId,
        receiver: { id: currentUserId },
        accepted: false,
      } as FriendRequest;

      jest.spyOn(service, 'findById').mockResolvedValue(mockRequest);
      const deleteSpy = jest
        .spyOn(service, 'deleteFriendRequest')
        .mockResolvedValue(undefined);

      const result = await service.resolveFriendRequest(
        requestId,
        false,
        currentUserId,
      );

      expect(result).toBe(false);
      expect(deleteSpy).toHaveBeenCalledWith(requestId);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should set accepted to true and save the request', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;
      const mockRequest = {
        id: 1,
        accepted: false,
      } as FriendRequest;

      friendRepo.save?.mockResolvedValue({ ...mockRequest, accepted: true });

      await service.acceptFriendRequest(mockRequest);

      expect(mockRequest.accepted).toBe(true);
      expect(friendRepo.save).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('deleteFriendRequest', () => {
    it('should call repository delete', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;
      const requestId = 1;

      friendRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });

      await service.deleteFriendRequest(requestId);

      expect(friendRepo.delete).toHaveBeenCalledWith(requestId);
    });
  });
});
