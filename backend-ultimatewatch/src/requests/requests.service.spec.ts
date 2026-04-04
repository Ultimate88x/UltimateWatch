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
});
