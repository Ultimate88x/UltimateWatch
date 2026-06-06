import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { Request } from './entities/request.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { EventInviteRequest } from './entities/event-invite-request.entity';
import { EventAccessRequest } from './entities/event-access-request.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { MemberRole } from 'src/common/enums/member.role.enum';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('RequestsService', () => {
  let service: RequestsService;

  const mockUsersService = {
    findById: jest.fn(),
    findByUsername: jest.fn(),
  };

  const createMockRequestRepository = (): MockRepository<Request> => ({
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  });

  const createMockFriendRequestRepository =
    (): MockRepository<FriendRequest> => ({
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    });

  const createMockEventInviteRepository =
    (): MockRepository<EventInviteRequest> => ({
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
    });

  const createMockEventAccessRepository =
    (): MockRepository<EventAccessRequest> => ({
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
          provide: getRepositoryToken(EventInviteRequest),
          useValue: createMockEventInviteRepository(),
        },
        {
          provide: getRepositoryToken(EventAccessRequest),
          useValue: createMockEventAccessRepository(),
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
        expect.objectContaining({ skip: 5, take: 5 }),
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

      jest
        .spyOn(service, 'findFriendRequestById')
        .mockResolvedValue(mockRequest);

      await expect(
        service.resolveFriendRequest(requestId, true, currentUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if request is already accepted', async () => {
      const mockRequest = {
        id: requestId,
        receiver: { id: currentUserId },
        accepted: true,
      } as FriendRequest;

      jest
        .spyOn(service, 'findFriendRequestById')
        .mockResolvedValue(mockRequest);

      await expect(
        service.resolveFriendRequest(requestId, true, currentUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call acceptRequest when accept is true', async () => {
      const mockRequest = {
        id: requestId,
        receiver: { id: currentUserId },
        accepted: false,
      } as FriendRequest;

      jest
        .spyOn(service, 'findFriendRequestById')
        .mockResolvedValue(mockRequest);
      const acceptSpy = jest
        .spyOn(service, 'acceptRequest')
        .mockResolvedValue(undefined);

      const result = await service.resolveFriendRequest(
        requestId,
        true,
        currentUserId,
      );

      expect(result).toBe(true);
      expect(acceptSpy).toHaveBeenCalledWith(mockRequest);
    });

    it('should call deleteRequest when accept is false', async () => {
      const mockRequest = {
        id: requestId,
        receiver: { id: currentUserId },
        accepted: false,
      } as FriendRequest;

      jest
        .spyOn(service, 'findFriendRequestById')
        .mockResolvedValue(mockRequest);
      const deleteSpy = jest
        .spyOn(service, 'deleteRequest')
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

  describe('acceptRequest', () => {
    it('should set accepted to true and save the request', async () => {
      const requestRepo = service[
        'requestsRepository'
      ] as unknown as MockRepository<Request>;
      const mockRequest = { id: 1, accepted: false } as Request;

      requestRepo.save?.mockResolvedValue({ ...mockRequest, accepted: true });

      await service.acceptRequest(mockRequest);

      expect(mockRequest.accepted).toBe(true);
      expect(requestRepo.save).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('deleteRequest', () => {
    it('should call repository delete', async () => {
      const requestRepo = service[
        'requestsRepository'
      ] as unknown as MockRepository<Request>;
      const requestId = 1;

      requestRepo.delete = jest.fn().mockResolvedValue({ affected: 1 });

      await service.deleteRequest(requestId);

      expect(requestRepo.delete).toHaveBeenCalledWith(requestId);
    });
  });

  describe('getFriendsFromUser', () => {
    const userId = 1;
    const mockUser = { id: userId, username: 'me' } as User;
    const mockFriendA = {
      id: 2,
      username: 'friend_A',
      imagePath: 'img_a',
    } as User;
    const mockFriendB = {
      id: 3,
      username: 'friend_B',
      imagePath: 'img_b',
    } as User;

    it('should return a paginated list of friends identifying the correct friend', async () => {
      const friendRepo = service[
        'friendRequestsRepository'
      ] as unknown as MockRepository<FriendRequest>;

      const mockFriendships = [
        {
          id: 101,
          accepted: true,
          sender: mockUser,
          receiver: mockFriendA,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 102,
          accepted: true,
          sender: mockFriendB,
          receiver: mockUser,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as FriendRequest[];

      mockUsersService.findById.mockResolvedValue(mockUser);
      friendRepo.findAndCount?.mockResolvedValue([mockFriendships, 2]);

      const result = await service.getFriendsFromUser(userId, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].username).toBe(mockFriendA.username);
      expect(result.data[1].username).toBe(mockFriendB.username);
    });
  });

  describe('deleteFriend', () => {
    const username = 'friendUser';
    const userId = 1;
    const friendId = 2;
    const mockFriend = { id: friendId, username: username } as User;

    it('should delete a friend request if relationship exists', async () => {
      const mockFriendRequest = { id: 500 } as FriendRequest;

      mockUsersService.findByUsername.mockResolvedValue(mockFriend);
      mockUsersService.findById.mockResolvedValue({ id: userId });

      const findSpy = jest
        .spyOn(service, 'findActiveFriendRequestBetweenUsers')
        .mockResolvedValue(mockFriendRequest);

      const deleteSpy = jest
        .spyOn(service, 'deleteRequest')
        .mockResolvedValue(undefined);

      await service.deleteFriend(username, userId);

      expect(mockUsersService.findByUsername).toHaveBeenCalledWith(username);
      expect(findSpy).toHaveBeenCalledWith(friendId, userId);
      expect(deleteSpy).toHaveBeenCalledWith(mockFriendRequest.id);
    });

    it('should throw ResourceNotFoundException if no active relationship is found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockFriend);
      mockUsersService.findById.mockResolvedValue({ id: userId });

      jest
        .spyOn(service, 'findActiveFriendRequestBetweenUsers')
        .mockResolvedValue(null);

      await expect(service.deleteFriend(username, userId)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('createEventInviteRequest', () => {
    const senderId = 1;
    const receiverId = 2;
    const eventId = 99;

    it('should throw BadRequestException if inviting oneself', async () => {
      await expect(
        service.createEventInviteRequest(senderId, {
          receiverId: senderId,
          eventId,
        }),
      ).rejects.toThrow(
        new BadRequestException('You cannot invite yourself to an event'),
      );
    });

    it('should throw BadRequestException if ongoing request exists', async () => {
      jest
        .spyOn(service, 'findActiveEventInviteRequestBetweenUsers')
        .mockResolvedValue({ id: 10 } as Request);
      await expect(
        service.createEventInviteRequest(senderId, { receiverId, eventId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create event invite', async () => {
      const inviteRepo = service[
        'eventInviteRequestsRepository'
      ] as unknown as MockRepository<EventInviteRequest>;
      jest
        .spyOn(service, 'findActiveEventInviteRequestBetweenUsers')
        .mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue({ id: senderId } as User);
      inviteRepo.create?.mockReturnValue({ id: 5 } as EventInviteRequest);
      inviteRepo.save?.mockResolvedValue({ id: 5 } as EventInviteRequest);

      await service.createEventInviteRequest(senderId, { receiverId, eventId });
      expect(inviteRepo.create).toHaveBeenCalled();
      expect(inviteRepo.save).toHaveBeenCalled();
    });
  });

  describe('createEventAccessRequest', () => {
    const senderId = 1;
    const eventId = 99;

    it('should throw BadRequestException if ongoing access request exists', async () => {
      jest
        .spyOn(service, 'findActiveEventAccessRequestToEvent')
        .mockResolvedValue({ id: 12 } as Request);
      await expect(
        service.createEventAccessRequest(senderId, eventId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create access request', async () => {
      const accessRepo = service[
        'eventAccessRequestRepository'
      ] as unknown as MockRepository<EventAccessRequest>;
      jest
        .spyOn(service, 'findActiveEventAccessRequestToEvent')
        .mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue({ id: senderId } as User);
      accessRepo.create?.mockReturnValue({ id: 6 } as EventAccessRequest);
      accessRepo.save?.mockResolvedValue({ id: 6 } as EventAccessRequest);

      await service.createEventAccessRequest(senderId, eventId);
      expect(accessRepo.create).toHaveBeenCalled();
    });
  });

  describe('deleteEventInviteRequest', () => {
    it('should throw BadRequestException if request is already accepted', async () => {
      jest
        .spyOn(service, 'findEventInviteRequestBetweenUsers')
        .mockResolvedValue({ id: 1, accepted: true } as Request);
      await expect(service.deleteEventInviteRequest(1, 2, 3)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete request successfully if not accepted', async () => {
      jest
        .spyOn(service, 'findEventInviteRequestBetweenUsers')
        .mockResolvedValue({ id: 8, accepted: false } as Request);
      const deleteSpy = jest
        .spyOn(service, 'deleteRequest')
        .mockResolvedValue(undefined);

      await service.deleteEventInviteRequest(1, 2, 3);
      expect(deleteSpy).toHaveBeenCalledWith(8);
    });
  });

  describe('deleteAccessRequestToEvent', () => {
    const userId = 1;
    const requestId = 10;

    it('should throw BadRequestException if already accepted', async () => {
      jest.spyOn(service, 'findEventAccessRequestById').mockResolvedValue({
        id: requestId,
        accepted: true,
      } as EventAccessRequest);
      await expect(
        service.deleteAccessRequestToEvent(userId, requestId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow deletion if user is the sender of the request', async () => {
      jest.spyOn(service, 'findEventAccessRequestById').mockResolvedValue({
        id: requestId,
        accepted: false,
        sender: { id: userId },
      } as EventAccessRequest);
      const deleteSpy = jest
        .spyOn(service, 'deleteRequest')
        .mockResolvedValue(undefined);

      await service.deleteAccessRequestToEvent(userId, requestId);
      expect(deleteSpy).toHaveBeenCalledWith(requestId);
    });

    it('should allow deletion if user is the owner of the target event', async () => {
      jest.spyOn(service, 'findEventAccessRequestById').mockResolvedValue({
        id: requestId,
        accepted: false,
        sender: { id: 99 },
        event: {
          members: [{ role: MemberRole.OWNER, user: { id: userId } }],
        },
      } as unknown as EventAccessRequest);
      const deleteSpy = jest
        .spyOn(service, 'deleteRequest')
        .mockResolvedValue(undefined);

      await service.deleteAccessRequestToEvent(userId, requestId);
      expect(deleteSpy).toHaveBeenCalledWith(requestId);
    });

    it('should throw ForbiddenException if user is neither sender nor event owner', async () => {
      jest.spyOn(service, 'findEventAccessRequestById').mockResolvedValue({
        id: requestId,
        accepted: false,
        sender: { id: 99 },
        event: {
          members: [{ role: MemberRole.OWNER, user: { id: 88 } }],
        },
      } as unknown as EventAccessRequest);

      await expect(
        service.deleteAccessRequestToEvent(userId, requestId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
