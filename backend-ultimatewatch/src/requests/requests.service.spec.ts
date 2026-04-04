import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { UsersService } from 'src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { BadRequestException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { CreateFriendRequestDto } from './dto/create-friend-request-dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('RequestsService', () => {
  let service: RequestsService;

  const createMockRequestRepository = (): MockRepository<Request> => ({
    findOne: jest.fn(),
  });

  const createMockFriendRequestRepository =
    (): MockRepository<FriendRequest> => ({
      create: jest.fn(),
      save: jest.fn(),
    });

  const mockUsersService = {
    findById: jest.fn(),
  };

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a request if found', async () => {
      const mockRequest = { id: 1 } as Request;
      const requestRepo = service[
        'requestsRepository'
      ] as unknown as MockRepository<Request>;
      requestRepo.findOne?.mockResolvedValue(mockRequest);

      const result = await service.findById(1);

      expect(result).toEqual(mockRequest);
      expect(requestRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw ResourceNotFoundException if request not found', async () => {
      const requestRepo = service[
        'requestsRepository'
      ] as unknown as MockRepository<Request>;
      requestRepo.findOne?.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('createFriendRequest', () => {
    const dto: CreateFriendRequestDto = {
      senderId: 1,
      receiverId: 2,
    };

    const mockSender = { id: 1, username: 'sender' } as User;
    const mockReceiver = { id: 2, username: 'receiver' } as User;

    it('should throw BadRequestException if sender and receiver are the same', async () => {
      const invalidDto: CreateFriendRequestDto = { senderId: 1, receiverId: 1 };

      await expect(service.createFriendRequest(invalidDto)).rejects.toThrow(
        new BadRequestException('You cannot send a friend request to yourself'),
      );
    });

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
      });

      friendRepo.create?.mockReturnValue(mockFriendRequest);
      friendRepo.save?.mockResolvedValue(mockFriendRequest);

      const result = await service.createFriendRequest(dto);

      expect(mockUsersService.findById).toHaveBeenCalledTimes(2);
      expect(friendRepo.create).toHaveBeenCalledWith({
        sender: mockSender,
        receiver: mockReceiver,
      });
      expect(friendRepo.save).toHaveBeenCalledWith(mockFriendRequest);
      expect(result).toEqual(mockFriendRequest);
    });

    it('should propagate error if usersService.findById fails', async () => {
      mockUsersService.findById.mockRejectedValue(
        new ResourceNotFoundException('User', 'ID', '1'),
      );

      await expect(service.createFriendRequest(dto)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });
});
