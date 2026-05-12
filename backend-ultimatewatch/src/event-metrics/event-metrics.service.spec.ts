import { Test, TestingModule } from '@nestjs/testing';
import { EventMetricsService } from './event-metrics.service';

describe('EventMetricsService', () => {
  let service: EventMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventMetricsService],
    }).compile();

    service = module.get<EventMetricsService>(EventMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
