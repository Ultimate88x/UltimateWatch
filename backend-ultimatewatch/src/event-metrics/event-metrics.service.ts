import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EventMetric } from './entities/event-metric.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventGateway } from 'src/websockets/event.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from 'src/events/events.service';
import { Event } from 'src/events/entities/event.entity';
import { CommentsService } from 'src/comments/comments.service';
import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventMetricsDto } from './dto/event-metrics-dto';
import { MembersService } from 'src/members/members.service';
import { Member } from 'src/members/entities/member.entity';
import { EventMetricsDetailDto } from './dto/event-metrics-detail-dto';
import { UserMetricsDto } from './dto/user-metrics-dto';
import { UsersService } from 'src/users/users.service';
import { VotesService } from 'src/votes/votes.service';

@Injectable()
export class EventMetricsService {
  constructor(
    @InjectRepository(EventMetric)
    private readonly eventMetricsRepository: Repository<EventMetric>,
    private readonly eventsService: EventsService,
    private readonly commentsService: CommentsService,
    private readonly membersService: MembersService,
    private readonly usersService: UsersService,
    private readonly votesService: VotesService,
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

      const lastSnapshot = await this.eventMetricsRepository.findOne({
        where: { event: { id: event.id } },
        order: { createdAt: 'DESC' },
      });

      const totalMessagesAtPreviousMinute = lastSnapshot
        ? lastSnapshot.accumulatedMessages
        : 0;

      const eventMessages = await this.commentsService.countFromEvent(event.id);

      const messagesInThisMinute =
        eventMessages - totalMessagesAtPreviousMinute;

      await this.eventMetricsRepository.save({
        event: event,
        viewerCount: sockets.length,
        messagesPerMinute: messagesInThisMinute,
        accumulatedMessages: eventMessages,
      });
    }
  }

  async getEventStatistics(
    userId: number,
    eventId: number,
  ): Promise<EventMetricsDto> {
    const event: Event = await this.eventsService.findBydId(eventId);
    const eventOwner: Member =
      await this.membersService.getOwnerFromEvent(eventId);

    if (userId !== eventOwner.user.id) {
      throw new ForbiddenException('You cannot access this information');
    }

    if (event.status !== EventStatus.FINISHED || !event.endDate) {
      throw new BadRequestException(
        'Cannot retrieve statistics from a not finished event',
      );
    }

    const eventMetrics: EventMetric[] = await this.eventMetricsRepository.find({
      where: {
        event: { id: eventId },
      },
      order: { createdAt: 'ASC' },
    });

    const totalViewersSum = eventMetrics.reduce(
      (accumulator: number, metric: EventMetric) =>
        accumulator + metric.viewerCount,
      0,
    );

    const averageViewers = totalViewersSum / (eventMetrics.length || 1);

    const startDate: Date = event.startDate || event.eventDate;
    const durationMs = event.endDate.getTime() - startDate.getTime();
    const durationInSeconds = Math.max(0, Math.round(durationMs / 1000));

    const uniqueFromEvent: number =
      await this.membersService.countTotalUniqueFromEvent(eventId);

    return new EventMetricsDto({
      maxViewerCount: Math.max(
        ...eventMetrics.map((metric: EventMetric) => metric.viewerCount),
        uniqueFromEvent,
      ),
      uniqueViewersCount: uniqueFromEvent,
      viewersPerMinute: Math.round(averageViewers),
      messagesPerMinute:
        eventMetrics.length > 0
          ? Math.round(
              eventMetrics[eventMetrics.length - 1].messagesPerMinute || 0,
            )
          : 0,
      totalMessages: await this.commentsService.countFromEvent(event.id),
      duration: durationInSeconds,
      metricsDetails: eventMetrics.map(
        (metric: EventMetric) =>
          new EventMetricsDetailDto({
            viewerCount: metric.viewerCount,
            messageCount: metric.messagesPerMinute,
          }),
      ),
    });
  }

  async getUserStatistics(userId: number): Promise<UserMetricsDto> {
    await this.usersService.findById(userId);

    return new UserMetricsDto({
      createdEvents: (await this.eventsService.getCreatedEventsByUser(userId))
        .total,
      votes: await this.votesService.countFromUser(userId),
      messages: await this.commentsService.countFromUser(userId),
    });
  }
}
