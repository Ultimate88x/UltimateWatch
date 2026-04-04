import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';

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
}
