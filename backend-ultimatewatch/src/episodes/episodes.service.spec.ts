import { Test, TestingModule } from '@nestjs/testing';
import { EpisodeService } from './episodes.service';
import { Episode } from './entities/episode.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { SeasonService } from 'src/seasons/seasons.service';
import { ObjectLiteral, Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('EpisodeService', () => {
  let service: EpisodeService;

  const createMockRepository = (): MockRepository<Episode> => ({});

  const mockTmdbApiService = {};
  const mockSeasonsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpisodeService,
        {
          provide: getRepositoryToken(Episode),
          useValue: createMockRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
        {
          provide: SeasonService,
          useValue: mockSeasonsService,
        },
      ],
    }).compile();

    service = module.get<EpisodeService>(EpisodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
