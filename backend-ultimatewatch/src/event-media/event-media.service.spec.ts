import { Test, TestingModule } from '@nestjs/testing';
import { EventMediaService } from './event-media.service';

describe('EventMediaService', () => {
  let service: EventMediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventMediaService],
    }).compile();

    service = module.get<EventMediaService>(EventMediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
