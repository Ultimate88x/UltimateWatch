import { Body, Controller, Post } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateFriendRequestDto } from './dto/create-friend-request-dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('create/friend-request')
  async createFriendRequest(
    @Body() createFriendRequestDto: CreateFriendRequestDto,
  ): Promise<{ message: string }> {
    await this.requestsService.createFriendRequest(createFriendRequestDto);

    return {
      message: 'Friend request sent successfully',
    };
  }
}
