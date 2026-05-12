import { Injectable } from '@nestjs/common';
import { EventMetric } from './entities/event-metric.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventGateway } from 'src/websockets/event.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from 'src/events/events.service';
import { Event } from 'src/events/entities/event.entity';

@Injectable()
export class EventMetricsService {
  constructor(
    @InjectRepository(EventMetric)
    private readonly eventMetricsRepository: Repository<EventMetric>,
    private readonly eventsService: EventsService,
    private readonly eventGateway: EventGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async takeSnapshots() {
    const activeEvents: Event[] = await this.eventsService.getActiveEvents();

    for (const event of activeEvents) {
      const roomName = `event_${event.id}`;
      const sockets = await this.eventGateway.server
        .in(roomName)
        .fetchSockets();

      await this.eventMetricsRepository.save({
        event: event,
        viewerCount: sockets.length,
      });
    }
  }
}
