export class EventMetricsDetailDto {
  viewerCount: number;
  messageCount: number;

  constructor(init?: Partial<EventMetricsDetailDto>) {
    Object.assign(this, init);
  }
}
