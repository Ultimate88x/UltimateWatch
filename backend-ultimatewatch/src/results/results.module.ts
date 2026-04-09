import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { VotesModule } from 'src/votes/votes.module';
import { MediaModule } from 'src/media/media.module';
import { ResultsService } from './results.service';

@Module({
  imports: [EventsModule, VotesModule, MediaModule],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
