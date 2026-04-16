import {
  Body,
  Controller,
  Get,
  Param,
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

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

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

  @Get('/available')
  @UseGuards(AuthGuard)
  async findAvailableEvents(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
  ): Promise<ListEventResponseDto> {
    return await this.eventsService.getEventsWithoutUser(userId, page, limit);
  }

  @Get('/joined')
  @UseGuards(AuthGuard)
  async findJoinedEvents(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
  ): Promise<ListEventResponseDto> {
    return await this.eventsService.getJoinedEventsByUser(userId, page, limit);
  }

  @Get('/created')
  @UseGuards(AuthGuard)
  async findCreatedEvents(
    @GetUser('userId') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
  ): Promise<ListEventResponseDto> {
    return await this.eventsService.getCreatedEventsByUser(userId, page, limit);
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
}
