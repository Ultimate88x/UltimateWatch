import { Module } from '@nestjs/common';
import { EventsModule } from 'src/events/events.module';
import { MediaModule } from 'src/media/media.module';
import { ResultsService } from './results.service';
import { EventMediaModule } from 'src/event-media/event-media.module';

@Module({
  imports: [EventsModule, MediaModule, EventMediaModule],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
