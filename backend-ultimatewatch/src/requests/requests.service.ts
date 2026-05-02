import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { FriendRequest } from './entities/friend-request.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { RequestDto } from './dto/request-dto';
import { RequestResponseDto } from './dto/request-response-dto';
import { EventInviteRequest } from './entities/event-invite-request.entity';
import { CreateEventInviteRequestDto } from './dto/create-event-invite-request-dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
    @InjectRepository(EventInviteRequest)
    private readonly eventInviteRequestsRepository: Repository<EventInviteRequest>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async saveFriendRequest(
    friendRequest: FriendRequest,
  ): Promise<FriendRequest> {
    return await this.friendRequestsRepository.save(friendRequest);
  }

  async saveEventInviteRequest(
    eventInviteRequest: EventInviteRequest,
  ): Promise<EventInviteRequest> {
    return await this.eventInviteRequestsRepository.save(eventInviteRequest);
  }

  async findById(id: number): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });

    if (!request) {
      throw new ResourceNotFoundException('Request', 'ID', id.toString());
    }

    return request;
  }

  async findActiveFriendRequestBetweenUsers(
    userId1: number,
    userId2: number,
  ): Promise<Request | null> {
    const request = await this.friendRequestsRepository.findOne({
      where: [
        {
          sender: { id: userId1 },
          receiver: { id: userId2 },
        },
        {
          sender: { id: userId2 },
          receiver: { id: userId1 },
        },
      ],
    });

    return request;
  }

  async findActiveEventInviteRequestBetweenUsers(
    userId1: number,
    userId2: number,
    eventId: number,
  ): Promise<Request | null> {
    const request = await this.eventInviteRequestsRepository.findOne({
      where: [
        {
          sender: { id: userId1 },
          receiver: { id: userId2 },
          event: { id: eventId },
          accepted: false,
        },
        {
          sender: { id: userId2 },
          receiver: { id: userId1 },
          event: { id: eventId },
          accepted: false,
        },
      ],
    });

    return request;
  }

  async findEventInviteRequestBetweenUsers(
    userId1: number,
    userId2: number,
    eventId: number,
  ): Promise<Request | null> {
    const request = await this.eventInviteRequestsRepository.findOne({
      where: [
        {
          sender: { id: userId1 },
          receiver: { id: userId2 },
          event: { id: eventId },
        },
        {
          sender: { id: userId2 },
          receiver: { id: userId1 },
          event: { id: eventId },
        },
      ],
    });

    return request;
  }

  async isFriendsWithUser(userId1: number, userId2: number): Promise<boolean> {
    const request = await this.friendRequestsRepository.findOne({
      where: [
        {
          sender: { id: userId1 },
          receiver: { id: userId2 },
          accepted: true,
        },
        {
          sender: { id: userId2 },
          receiver: { id: userId1 },
          accepted: true,
        },
      ],
    });

    return !!request;
  }

  async getPendingReceivedFriendRequestsFromUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<RequestResponseDto> {
    await this.usersService.findById(userId);
    const skip = (page - 1) * limit;

    const [friendRequests, total] =
      await this.friendRequestsRepository.findAndCount({
        where: {
          receiver: { id: userId },
          accepted: false,
        },
        relations: ['sender'],
        order: {
          createdAt: 'DESC',
        },
        skip: skip,
        take: limit,
      });

    const data = friendRequests.map(
      (request: FriendRequest) =>
        new RequestDto({
          id: request.id,
          username: request.sender.username,
          userImagePath: request.sender.imagePath,
          createdAt: request.createdAt.toISOString(),
        }),
    );

    return new RequestResponseDto({
      data: data,
      total: total,
      page: page,
      lastPage: Math.ceil(total / limit) || 1,
    });
  }

  async getPendingSentFriendRequestsFromUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<RequestResponseDto> {
    await this.usersService.findById(userId);
    const skip = (page - 1) * limit;

    const [friendRequests, total] =
      await this.friendRequestsRepository.findAndCount({
        where: {
          sender: { id: userId },
          accepted: false,
        },
        relations: ['receiver'],
        order: {
          createdAt: 'DESC',
        },
        skip: skip,
        take: limit,
      });

    const data = friendRequests.map(
      (request: FriendRequest) =>
        new RequestDto({
          id: request.id,
          username: request.receiver.username,
          userImagePath: request.receiver.imagePath,
          createdAt: request.createdAt.toISOString(),
        }),
    );

    return new RequestResponseDto({
      data: data,
      total: total,
      page: page,
      lastPage: Math.ceil(total / limit) || 1,
    });
  }

  async createFriendRequest(
    senderId: number,
    receiverId: number,
  ): Promise<void> {
    if (senderId === receiverId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    const existingRequest: Request | null =
      await this.findActiveFriendRequestBetweenUsers(senderId, receiverId);

    if (existingRequest) {
      if (!existingRequest.accepted) {
        throw new BadRequestException(
          'A friend request is already pending for this user',
        );
      }

      throw new BadRequestException('You are already friends with this user');
    }

    const sender: User = await this.usersService.findById(senderId);
    const receiver: User = await this.usersService.findById(receiverId);

    const newRequest = this.friendRequestsRepository.create({
      sender,
      receiver,
    });

    await this.saveFriendRequest(newRequest);
  }

  async createEventInviteRequest(
    senderId: number,
    createEventInviteRequestDto: CreateEventInviteRequestDto,
  ): Promise<void> {
    const { receiverId, eventId } = createEventInviteRequestDto;
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot invite yourself to an event');
    }

    const existingRequest: Request | null =
      await this.findActiveEventInviteRequestBetweenUsers(
        senderId,
        receiverId,
        eventId,
      );

    if (existingRequest) {
      throw new BadRequestException(
        'You have an ongoing invite request for this user and event',
      );
    }

    const sender: User = await this.usersService.findById(senderId);
    const receiver: User = await this.usersService.findById(receiverId);

    const newRequest = this.eventInviteRequestsRepository.create({
      sender,
      receiver,
      event: { id: eventId },
    });

    await this.saveEventInviteRequest(newRequest);
  }

  async getRelationStatus(
    senderId: number,
    receiverId: number,
  ): Promise<'pending' | 'accepted' | 'none'> {
    const request = await this.friendRequestsRepository.findOne({
      where: [
        { sender: { id: senderId }, receiver: { id: receiverId } },
        { sender: { id: receiverId }, receiver: { id: senderId } },
      ],
    });

    if (!request) return 'none';
    return request.accepted ? 'accepted' : 'pending';
  }

  async acceptFriendRequest(friendRequest: FriendRequest): Promise<void> {
    friendRequest.accepted = true;

    await this.saveFriendRequest(friendRequest);
  }

  async deleteRequest(id: number): Promise<void> {
    await this.requestsRepository.delete(id);
  }

  async deleteEventInviteRequest(
    userId: number,
    otherUserId: number,
    eventId: number,
  ): Promise<void> {
    const request: Request | null =
      await this.findEventInviteRequestBetweenUsers(
        userId,
        otherUserId,
        eventId,
      );

    if (!request) {
      throw new ResourceNotFoundException(
        'Event Invite Request',
        'USER_ID, OTHER_USER_ID, EVENT_ID',
        `${userId.toString()}, ${otherUserId.toString()}, ${eventId.toString()}`,
      );
    }

    await this.deleteRequest(request.id);
  }

  async resolveFriendRequest(
    id: number,
    accept: boolean,
    currentUserId,
  ): Promise<boolean> {
    const request: Request = await this.findById(id);

    if (request.receiver.id !== currentUserId) {
      throw new ForbiddenException(
        'You are not authorized to resolve this request',
      );
    }

    if (request.accepted) {
      throw new BadRequestException('This request has already been resolved');
    }

    if (accept) {
      await this.acceptFriendRequest(request);
    } else {
      await this.deleteRequest(id);
    }

    return accept;
  }

  async getFriendsFromUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<RequestResponseDto> {
    await this.usersService.findById(userId);
    const skip = (page - 1) * limit;

    const [friendships, total] =
      await this.friendRequestsRepository.findAndCount({
        where: [
          { sender: { id: userId }, accepted: true },
          { receiver: { id: userId }, accepted: true },
        ],
        relations: ['sender', 'receiver'],
        skip: skip,
        take: limit,
      });

    const data = friendships.map((request: FriendRequest) => {
      const friend =
        request.sender.id === userId ? request.receiver : request.sender;

      return new RequestDto({
        id: request.id,
        username: friend.username,
        userImagePath: friend.imagePath,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      });
    });

    return new RequestResponseDto({
      data: data,
      total: total,
      page: page,
      lastPage: Math.ceil(total / limit) || 1,
    });
  }

  async deleteFriend(username: string, userId: number): Promise<void> {
    const friend: User = await this.usersService.findByUsername(username);
    await this.usersService.findById(userId);

    const friendRequest: FriendRequest | null =
      await this.findActiveFriendRequestBetweenUsers(friend.id, userId);

    if (!friendRequest) {
      throw new ResourceNotFoundException(
        'Friend Request',
        'USER_USERNAME, USER_ID',
        `${username}, ${userId}`,
      );
    }

    await this.deleteRequest(friendRequest.id);
  }
}
