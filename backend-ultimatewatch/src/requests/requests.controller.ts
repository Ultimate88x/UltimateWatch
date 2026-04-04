import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RequestDto } from './dto/request-dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('create/friend-request')
  @UseGuards(AuthGuard)
  async createFriendRequest(
    @GetUser('userId') userId: number,
    @Body('receiverId') receiverId: number,
  ): Promise<{ message: string }> {
    await this.requestsService.createFriendRequest(userId, receiverId);

    return {
      message: 'Friend request sent successfully!',
    };
  }

  @Get('received')
  @UseGuards(AuthGuard)
  async findPendingReceivedFriendRequests(
    @GetUser('userId') userId: number,
  ): Promise<RequestDto[]> {
    const data: RequestDto[] =
      await this.requestsService.getPendingReceivedFriendRequestsFromUser(
        userId,
      );

    return data;
  }

  @Get('sent')
  @UseGuards(AuthGuard)
  async findPendingSentFriendRequests(
    @GetUser('userId') userId: number,
  ): Promise<RequestDto[]> {
    const data: RequestDto[] =
      await this.requestsService.getPendingSentFriendRequestsFromUser(userId);

    return data;
  }
}
