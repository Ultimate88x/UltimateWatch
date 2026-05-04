import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RequestResponseDto } from './dto/request-response-dto';
import { ResolveRequestDto } from './dto/resolve-request-dto';
import { FriendRequestDto } from './dto/friend-request-dto';
import { EventInvitationRequestDto } from './dto/event-invitation-request-dto';

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
      message: 'Request sent successfully!',
    };
  }

  @Get('friend-request/received')
  @UseGuards(AuthGuard)
  async findPendingReceivedFriendRequests(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<RequestResponseDto<FriendRequestDto>> {
    return await this.requestsService.getPendingReceivedFriendRequestsFromUser(
      userId,
      +page,
      +limit,
    );
  }

  @Get('friend-request/sent')
  @UseGuards(AuthGuard)
  async findPendingSentFriendRequests(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<RequestResponseDto<FriendRequestDto>> {
    return await this.requestsService.getPendingSentFriendRequestsFromUser(
      userId,
      +page,
      +limit,
    );
  }

  @Patch('resolve/:id')
  @UseGuards(AuthGuard)
  async resolveFriendRequest(
    @GetUser('userId') userId: number,
    @Param('id') id: number,
    @Body() resolveRequestDto: ResolveRequestDto,
  ): Promise<{ message: string }> {
    const { accept } = resolveRequestDto;
    await this.requestsService.resolveRequest(+id, accept, userId);

    return {
      message: `Request successfully ${accept ? 'accepted' : 'rejected'}!`,
    };
  }

  @Get('friends')
  @UseGuards(AuthGuard)
  async findFriendsFromUser(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<RequestResponseDto<FriendRequestDto>> {
    return await this.requestsService.getFriendsFromUser(userId, +page, +limit);
  }

  @Delete('friend/:username')
  @UseGuards(AuthGuard)
  async deleteFriend(
    @GetUser('userId') userId: number,
    @Param('username') username: string,
  ): Promise<{ message: string }> {
    await this.requestsService.deleteFriend(username, userId);
    return { message: 'Successfully removed!' };
  }

  @Get('event-invite-request/received')
  @UseGuards(AuthGuard)
  async findPendingReceivedEventInvitationsFromUser(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<RequestResponseDto<EventInvitationRequestDto>> {
    return await this.requestsService.getPendingReceivedEventInvitationsFromUser(
      userId,
      +page,
      +limit,
    );
  }

  @Delete('event-invite/:eventId/:otherUserId')
  @UseGuards(AuthGuard)
  async deleteEventInviteRequest(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
    @Param('otherUserId') otherUserId: string,
  ): Promise<{ message: string }> {
    await this.requestsService.deleteEventInviteRequest(
      userId,
      +otherUserId,
      +eventId,
    );
    return { message: 'Successfully deleted!' };
  }
}
