import { Test, TestingModule } from '@nestjs/testing';
import { MediaContentsService } from './media-contents.service';

describe('MediaContentsService', () => {
  let service: MediaContentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaContentsService],
    }).compile();

    service = module.get<MediaContentsService>(MediaContentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
