import { Module } from '@nestjs/common';
import { EventMetricsService } from './event-metrics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMetric } from './entities/event-metric.entity';
import { WebsocketsModule } from 'src/websockets/websockets.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventMetric]),
    WebsocketsModule,
    EventsModule,
  ],
  providers: [EventMetricsService],
  exports: [EventMetricsService],
})
export class EventMetricsModule {}
