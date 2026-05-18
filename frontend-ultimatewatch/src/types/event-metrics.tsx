import type { EventMetricsDetail } from "./event-metrics-detail";

export type EventMetrics = {
  maxViewerCount: number;
  uniqueViewersCount: number;
  viewersPerMinute: number;
  messagesPerMinute: number;
  totalMessages: number;
  duration: number;
  metricsDetails: EventMetricsDetail[];
}
