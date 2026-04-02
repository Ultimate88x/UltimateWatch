import { Test, TestingModule } from '@nestjs/testing';
import { WatchmodeService } from './watchmode.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

type MockConfig = {
  WATCHMODE_API_KEY: string;
};

describe('WatchmodeService', () => {
  let service: WatchmodeService;

  const mockConfig = {
    WATCHMODE_API_KEY: 'WATCHMODE.valid_key',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        WatchmodeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key] as MockConfig),
          },
        },
      ],
    }).compile();

    service = module.get<WatchmodeService>(WatchmodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
