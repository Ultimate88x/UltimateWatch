import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventMedia } from 'src/event-media/entities/event-media.entity';
import { EventMediaService } from 'src/event-media/event-media.service';
import { VotingEvent } from 'src/events/entities/voting-event.entity';
import { EventsService } from 'src/events/events.service';
import { Media } from 'src/media/entities/media.entity';
import { MediaService } from 'src/media/media.service';
import { VoteResultDto } from 'src/votes/dto/vote-result.dto';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly mediaService: MediaService,
    private readonly eventMediaService: EventMediaService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredVotings() {
    const expiredVotingEvents: VotingEvent[] =
      await this.eventsService.findExpiredAndVoting();

    if (expiredVotingEvents.length === 0) return;

    for (const event of expiredVotingEvents) {
      try {
        await this.processVotingClosure(event.id);
        this.logger.log(`Voting for event ${event.id} closed succesfully`);
      } catch (error) {
        this.logger.error(
          `Error closing voting for ${event.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  async processVotingClosure(eventId: number): Promise<void> {
    const votingResults: VoteResultDto[] =
      await this.eventsService.getResultsByEvent(eventId);

    const event: VotingEvent =
      await this.eventsService.findVotingEventBydId(eventId);

    const mediaList: Media[] = await Promise.all(
      votingResults.map(async (result: VoteResultDto) =>
        this.mediaService.findByTmdbId(result.id),
      ),
    );

    const eventMediaList: EventMedia[] =
      await this.eventMediaService.createMany(event, mediaList);

    event.media = eventMediaList;
    event.status = EventStatus.WAITING;

    await this.eventsService.saveVotingEvent(event);
  }
}
