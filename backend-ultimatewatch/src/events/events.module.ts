import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { UsersModule } from 'src/users/users.module';
import { MediaModule } from 'src/media/media.module';
import { VotingEvent } from './entities/voting-event.entity';
import { StandardEvent } from './entities/standard-event.entity';
import { MembersModule } from 'src/members/members.module';
import { SeasonModule } from 'src/seasons/seasons.module';
import { EpisodeModule } from 'src/episodes/episodes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, StandardEvent, VotingEvent]),
    UsersModule,
    MediaModule,
    MembersModule,
    SeasonModule,
    EpisodeModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
