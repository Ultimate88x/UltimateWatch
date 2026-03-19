import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';

describe('MoviesService', () => {
  let service: MoviesService;

  const mockTmdbApiService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
