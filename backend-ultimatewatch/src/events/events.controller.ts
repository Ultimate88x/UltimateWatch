import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CreateEventDto } from './dto/create-event-dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createEvent(
    @GetUser('userId') userId: number,
    @Body() createEventDto: CreateEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.create(createEventDto, userId);

    return { message: 'Event succesfully created!' };
  }
}
