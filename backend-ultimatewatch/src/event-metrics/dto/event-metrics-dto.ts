import { EventMetricsDetailDto } from './event-metrics-detail-dto';

export class EventMetricsDto {
  maxViewerCount: number;
  uniqueViewersCount: number;
  viewersPerMinute: number;
  messagesPerMinute: number;
  totalMessages: number;
  duration: number;
  metricsDetails: EventMetricsDetailDto[];

  constructor(init?: Partial<EventMetricsDto>) {
    Object.assign(this, init);
  }
}
