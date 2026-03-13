import { Test, TestingModule } from '@nestjs/testing';
import { TmdbapiService } from './tmdbapi.service';

describe('TmdbapiService', () => {
  let service: TmdbapiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TmdbapiService],
    }).compile();

    service = module.get<TmdbapiService>(TmdbapiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
