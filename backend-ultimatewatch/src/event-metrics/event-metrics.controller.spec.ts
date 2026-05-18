import { Test, TestingModule } from '@nestjs/testing';
import { EventMetricsController } from './event-metrics.controller';

describe('EventMetricsController', () => {
  let controller: EventMetricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventMetricsController],
    }).compile();

    controller = module.get<EventMetricsController>(EventMetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
