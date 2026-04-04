/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable } from '@nestjs/common';
import { FriendRequest } from './entities/friend-request.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { CreateFriendRequestDto } from './dto/create-friend-request-dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
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

  async createFriendRequest(
    createFriendRequestDto: CreateFriendRequestDto,
  ): Promise<FriendRequest> {
    const { senderId, receiverId }: { senderId: number; receiverId: number } =
      createFriendRequestDto;

    if (senderId === receiverId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    const sender: User = await this.usersService.findById(senderId);
    const receiver: User = await this.usersService.findById(receiverId);

    const newRequest = this.friendRequestsRepository.create({
      sender,
      receiver,
    });

    return await this.friendRequestsRepository.save(newRequest);
  }
}
