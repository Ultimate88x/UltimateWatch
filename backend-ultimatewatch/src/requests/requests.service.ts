import {
  BadRequestException,
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

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async findById(id: number): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new ResourceNotFoundException('Request', 'ID', id.toString());
    }

    return request;
  }

  async findActiveFriendRequestBySenderIdAndReceiverId(
    senderId: number,
    receiverId: number,
  ): Promise<Request | null> {
    const request = await this.friendRequestsRepository.findOne({
      where: {
        sender: { id: senderId },
        receiver: { id: receiverId },
      },
    });

    return request;
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
          receiver: { id: userId },
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
      await this.findActiveFriendRequestBySenderIdAndReceiverId(
        senderId,
        receiverId,
      );

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

    await this.friendRequestsRepository.save(newRequest);
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
}
