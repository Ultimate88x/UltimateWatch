import { Test, TestingModule } from '@nestjs/testing';
import { EventMediaController } from './event-media.controller';

describe('EventMediaController', () => {
  let controller: EventMediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventMediaController],
    }).compile();

    controller = module.get<EventMediaController>(EventMediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
