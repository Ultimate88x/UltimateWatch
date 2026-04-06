import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { MembersModule } from 'src/members/members.module';
import { MediaModule } from 'src/media/media.module';
import { EventsService } from 'src/events/events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote]),
    MembersModule,
    MediaModule,
    EventsService,
  ],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
