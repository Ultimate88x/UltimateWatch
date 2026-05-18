import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { EventMetricsService } from './event-metrics.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EventMetricsDto } from './dto/event-metrics-dto';

@Controller('event-metrics')
export class EventMetricsController {
  constructor(private readonly eventsMetricsService: EventMetricsService) {}

  @Get('/event/:eventId')
  @UseGuards(AuthGuard)
  async getEventStatistics(
    @GetUser('userId') userId: number,
    @Param('eventId') eventId: string,
  ): Promise<EventMetricsDto> {
    const eventMetrics: EventMetricsDto =
      await this.eventsMetricsService.getEventStatistics(userId, +eventId);

    return eventMetrics;
  }
}
