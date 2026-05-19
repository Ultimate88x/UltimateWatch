import { Module } from '@nestjs/common';
import { EventMetricsService } from './event-metrics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMetric } from './entities/event-metric.entity';
import { WebsocketsModule } from 'src/websockets/websockets.module';
import { EventsModule } from 'src/events/events.module';
import { CommentsModule } from 'src/comments/comments.module';
import { MembersModule } from 'src/members/members.module';
import { EventMetricsController } from './event-metrics.controller';
import { UsersModule } from 'src/users/users.module';
import { VotesModule } from 'src/votes/votes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventMetric]),
    WebsocketsModule,
    EventsModule,
    CommentsModule,
    MembersModule,
    UsersModule,
    VotesModule,
  ],
  providers: [EventMetricsService],
  exports: [EventMetricsService],
  controllers: [EventMetricsController],
})
export class EventMetricsModule {}
