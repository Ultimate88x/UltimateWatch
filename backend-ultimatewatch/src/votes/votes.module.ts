import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { MembersModule } from 'src/members/members.module';
import { MediaModule } from 'src/media/media.module';
import { VotingEvent } from 'src/events/entities/voting-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, VotingEvent]),
    MembersModule,
    MediaModule,
  ],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
