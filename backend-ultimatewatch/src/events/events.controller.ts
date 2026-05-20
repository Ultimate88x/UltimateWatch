import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateVotingEventDto } from './dto/create-voting-event-dto';
import { CreateStandardEventDto } from './dto/create-standard-event-dto';
import { ListEventResponseDto } from './dto/list-event-response-dto';
import { EventDetailedInfoDto } from './dto/event-detailed-info-dto';
import { VoteResultDto } from 'src/votes/dto/vote-result.dto';
import { MediaEventDto } from './dto/media-event-dto';
import { VotingMediaEventDto } from './dto/voting-media-event-dto';
import { CreateEventInviteRequestDto } from 'src/requests/dto/create-event-invite-request-dto';
import { FriendInviteResponseDto } from './dto/friend-invite-response-dto';
import { ResolveRequestDto } from 'src/requests/dto/resolve-request-dto';
import { EventAccessRequestDto } from 'src/requests/dto/event-access-request-dto';
import { RequestResponseDto } from 'src/requests/dto/request-response-dto';
import { UpdateStandardEventDto } from './dto/update-standard-event-dto';
import { UpdateVotingEventDto } from './dto/update-voting-event-dto';
import { EventMediaRoomDto } from './dto/event-media-room-dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('/available')
  @UseGuards(AuthGuard)
  async findAvailableEvents(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
  ): Promise<ListEventResponseDto> {
    return await this.eventsService.getEventsWithoutUser(userId, page, limit);
  }

  @Get('/joined')
  @UseGuards(AuthGuard)
  async findJoinedEvents(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
  ): Promise<ListEventResponseDto> {
    return await this.eventsService.getJoinedEventsByUser(userId, page, limit);
  }

  @Get('/created')
  @UseGuards(AuthGuard)
  async findCreatedEvents(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
  ): Promise<ListEventResponseDto> {
    return await this.eventsService.getCreatedEventsByUser(userId, page, limit);
  }

  @Get('/created/:userId')
  @UseGuards(AuthGuard)
  async findVisibleCreatedEvents(
    @Param('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 12,
  ): Promise<ListEventResponseDto> {
    return await this.eventsService.getVisibleCreatedEventsByUser(
      userId,
      page,
      limit,
    );
  }

  @Get('/results/:eventId')
  @UseGuards(AuthGuard)
  async getEventVotingResults(
    @Param('eventId') eventId: number,
  ): Promise<VoteResultDto[]> {
    const voteResults: VoteResultDto[] =
      await this.eventsService.getFormattedResultsByEvent(eventId, false);

    return voteResults;
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async findEvent(@Param('id') id: string): Promise<EventDetailedInfoDto> {
    const event: EventDetailedInfoDto =
      await this.eventsService.getEventDetailedInformation(+id);

    return event;
  }

  @Get('/media/:id')
  @UseGuards(AuthGuard)
  async findMediaEventsFromEvent(
    @Param('id') id: string,
  ): Promise<MediaEventDto[] | VotingMediaEventDto[]> {
    const mediasEvent: MediaEventDto[] | VotingMediaEventDto[] =
      await this.eventsService.getMediasEventFromEvent(+id);

    return mediasEvent;
  }

  @Get('/status/:id')
  @UseGuards(AuthGuard)
  async getEventStatus(
    @GetUser('userId') userId: number,
    @Param('id') id: string,
  ): Promise<string> {
    const status: string = await this.eventsService.getEventStatus(userId, +id);

    return status;
  }

  @Get('room/:id/media')
  @UseGuards(AuthGuard)
  async findEventMediaForEventRoom(
    @Param('id') id: string,
  ): Promise<EventMediaRoomDto[]> {
    const eventMediaList: EventMediaRoomDto[] =
      await this.eventsService.getEventMediaForEventRoom(+id);

    return eventMediaList;
  }

  @Post('/standard')
  @UseGuards(AuthGuard)
  async createEvent(
    @GetUser('userId') userId: number,
    @Body() createEventDto: CreateStandardEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.handleCreateStandardEvent(createEventDto, userId);

    return { message: 'Event succesfully created!' };
  }

  @Post('/voting')
  @UseGuards(AuthGuard)
  async createVotingEvent(
    @GetUser('userId') userId: number,
    @Body() createVotingEvent: CreateVotingEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.handleCreateVotingEvent(createVotingEvent, userId);

    return { message: 'Event succesfully created!' };
  }

  @Post('/join/:id')
  @UseGuards(AuthGuard)
  async joinEvent(
    @GetUser('userId') userId: number,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.eventsService.joinEvent(userId, +id);

    return { message: 'Succesfully joined the event!' };
  }

  @Post('/leave/:id')
  @UseGuards(AuthGuard)
  async leaveEvent(
    @GetUser('userId') userId: number,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.eventsService.leaveEvent(userId, +id);

    return { message: 'Succesfully left the event!' };
  }

  @Patch('/add/:eventId/:mediaId')
  @UseGuards(AuthGuard)
  async addMedia(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
    @Param('mediaId') mediaId: string,
  ): Promise<{ message: string }> {
    await this.eventsService.addMediaToStandardEvent(
      userId,
      +eventId,
      +mediaId,
    );

    return { message: 'Media succesfully added!' };
  }

  @Patch('/suggest/:eventId/:mediaId')
  @UseGuards(AuthGuard)
  async suggestMedia(
    @Param('eventId') eventId: string,
    @Param('mediaId') mediaId: string,
  ): Promise<{ message: string }> {
    await this.eventsService.addProposedMediaToVotingEvent(+eventId, +mediaId);

    return { message: 'Media succesfully suggested!' };
  }

  @Patch('/remove/:eventId/:mediaId')
  @UseGuards(AuthGuard)
  async removeMediaFromEvent(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
    @Param('mediaId') mediaId: string,
  ): Promise<{ message: string }> {
    await this.eventsService.deleteMediaFromEvent(userId, +eventId, +mediaId);

    return { message: 'Media succesfully removed!' };
  }

  @Get('can-see/:eventId')
  @UseGuards(AuthGuard)
  async checkEventVisibility(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
  ): Promise<boolean> {
    const isVisible: boolean = await this.eventsService.checkCanSeeEvent(
      userId,
      +eventId,
    );

    return isVisible;
  }

  @Post('/invite')
  @UseGuards(AuthGuard)
  async inviteUserToEvent(
    @GetUser('userId') userId: number,
    @Body() createEventInviteRequestDto: CreateEventInviteRequestDto,
  ): Promise<{ message: string }> {
    await this.eventsService.inviteUserToEvent(
      userId,
      createEventInviteRequestDto,
    );
    return { message: 'User invited to event successfully!' };
  }

  @Post('/request-access/:eventId')
  @UseGuards(AuthGuard)
  async requestAccessToEvent(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
  ): Promise<{ message: string }> {
    await this.eventsService.requestAccessToEvent(userId, +eventId);
    return { message: 'Access to event requested successfully!' };
  }

  @Get('friends-to-invite/:eventId')
  @UseGuards(AuthGuard)
  async getFriendsToInvite(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<FriendInviteResponseDto> {
    const friendsToInvite: FriendInviteResponseDto =
      await this.eventsService.getFriendsToInvite(
        userId,
        +eventId,
        page,
        limit,
      );

    return friendsToInvite;
  }

  @Patch('event-invite-request/resolve/:id')
  @UseGuards(AuthGuard)
  async resolveEventInviteRequest(
    @GetUser('userId') userId: number,
    @Param('id') id: number,
    @Body() resolveRequestDto: ResolveRequestDto,
  ): Promise<{ message: string }> {
    const { accept } = resolveRequestDto;
    await this.eventsService.resolveEventInviteRequest(userId, +id, accept);

    return {
      message: `Request successfully ${accept ? 'accepted' : 'rejected'}!`,
    };
  }

  @Patch('event-access-request/resolve/:id')
  @UseGuards(AuthGuard)
  async resolveEventAccessRequest(
    @GetUser('userId') userId: number,
    @Param('id') id: number,
    @Body() resolveRequestDto: ResolveRequestDto,
  ): Promise<{ message: string }> {
    const { accept } = resolveRequestDto;
    await this.eventsService.resolveEventAccessRequest(userId, +id, accept);

    return {
      message: `Request successfully ${accept ? 'accepted' : 'rejected'}!`,
    };
  }

  @Get('access-requests/:eventId')
  @UseGuards(AuthGuard)
  async getActiveAccessRequests(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<RequestResponseDto<EventAccessRequestDto>> {
    const activeAccessRequests: RequestResponseDto<EventAccessRequestDto> =
      await this.eventsService.getActiveAccessRequestsFromEvent(
        userId,
        +eventId,
        page,
        limit,
      );

    return activeAccessRequests;
  }

  @Put('/standard/:eventId')
  @UseGuards(AuthGuard)
  async updateStandardEvent(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
    @Body() updateEventDto: UpdateStandardEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.handleUpdateStandardEvent(
      userId,
      +eventId,
      updateEventDto,
    );
    return { message: 'Event updated succesfully!' };
  }

  @Put('/voting/:eventId')
  @UseGuards(AuthGuard)
  async updateVotingEvent(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
    @Body() updateEventDto: UpdateVotingEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.handleUpdateVotingEvent(
      userId,
      +eventId,
      updateEventDto,
    );
    return { message: 'Event updated succesfully!' };
  }

  @Delete(':eventId')
  @UseGuards(AuthGuard)
  async cancelEvent(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
  ): Promise<{ message: string }> {
    await this.eventsService.cancelEvent(userId, +eventId);
    return { message: 'Event deleted succesfully!' };
  }
}
