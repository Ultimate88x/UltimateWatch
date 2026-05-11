import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { MemberListResponseDto } from './dto/member-list-response-dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { MemberDetailDto } from './dto/member-detail-dto';
import { KickMemberDto } from './dto/kick-member-dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpdateMemberRoleDto } from './dto/update-member-role-dto';

@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

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

  @Post('kick')
  @UseGuards(AuthGuard)
  async kickMember(
    @GetUser('userId') userId: number,
    @Body() kickMemberDto: KickMemberDto,
  ) {
    await this.membersService.kickMemberFromEvent(userId, kickMemberDto);

    this.eventEmitter.emit('member.kicked', { kickMemberDto });

    return { message: 'Member kicked successfully' };
  }

  @Patch('update-role')
  @UseGuards(AuthGuard)
  async updateMemberRole(
    @GetUser('userId') userId: number,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    await this.membersService.updateMemberRole(userId, updateMemberRoleDto);

    this.eventEmitter.emit('member.role-updated', { updateMemberRoleDto });

    return { message: 'Member role changed successfully' };
  }
}
