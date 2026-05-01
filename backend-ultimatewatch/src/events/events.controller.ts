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
  ): Promise<MediaEventDto[] | VotingMediaEventDto[] | null> {
    const mediasEvent: MediaEventDto[] | VotingMediaEventDto[] | null =
      await this.eventsService.getMediasEventFromEvent(+id);

    return mediasEvent;
  }

  @Post('/standard')
  @UseGuards(AuthGuard)
  async createEvent(
    @GetUser('userId') userId: number,
    @Body() createEventDto: CreateStandardEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.createStandardEvent(createEventDto, userId);

    return { message: 'Event succesfully created!' };
  }

  @Post('/voting')
  @UseGuards(AuthGuard)
  async createVotingEvent(
    @GetUser('userId') userId: number,
    @Body() createVotingEvent: CreateVotingEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.createVotingEvent(createVotingEvent, userId);

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

  @Patch('/suggest/:eventId/:mediaId')
  @UseGuards(AuthGuard)
  async suggestMedia(
    @Param('eventId') eventId: string,
    @Param('mediaId') mediaId: string,
  ): Promise<{ message: string }> {
    await this.eventsService.addProposedMediaToVotingEvent(+eventId, +mediaId);

    return { message: 'Media succesfully suggested!' };
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
}
