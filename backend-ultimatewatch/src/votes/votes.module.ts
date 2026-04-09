import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { MembersModule } from 'src/members/members.module';
import { MediaModule } from 'src/media/media.module';
import { EventsModule } from 'src/events/events.module';
import { Media } from 'src/media/entities/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Media]),
    MembersModule,
    MediaModule,
    EventsModule,
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
