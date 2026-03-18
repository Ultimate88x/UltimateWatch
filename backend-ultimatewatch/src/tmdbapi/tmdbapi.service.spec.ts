import { Test, TestingModule } from '@nestjs/testing';
import { TmdbApiService } from './tmdbapi.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

type MockConfig = {
  TMDB_API_KEY: string;
};

describe('TmdbApiService', () => {
  let service: TmdbApiService;

  const mockConfig = {
    TMDB_API_KEY: 'TMDB.valid_key',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        TmdbApiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key] as MockConfig),
          },
        },
      ],
    }).compile();

    service = module.get<TmdbApiService>(TmdbApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
