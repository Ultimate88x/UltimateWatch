import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { MemberListResponseDto } from './dto/member-list-response-dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { MemberDetailDto } from './dto/member-detail-dto';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('/event/:id')
  @UseGuards(AuthGuard)
  async findFromEvent(
    @GetUser('userId') userId: number,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<MemberListResponseDto> {
    const members: MemberListResponseDto =
      await this.membersService.getFromEvent(+id, page, limit, userId);

    return members;
  }

  @Get('/exists/:eventId')
  @UseGuards(AuthGuard)
  async retrieveMember(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
  ): Promise<MemberDetailDto | null> {
    const member: MemberDetailDto | null =
      await this.membersService.retrieveByUserIdAndEventId(userId, +eventId);

    return member;
  }
}
