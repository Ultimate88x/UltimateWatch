import { Test, TestingModule } from '@nestjs/testing';
import { SeriesService } from './series.service';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Series } from './entities/series.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { SeasonService } from 'src/seasons/seasons.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('SeriesService', () => {
  let service: SeriesService;

  const createMockRepository = (): MockRepository<Series> => ({});

  const mockTmdbApiService = {};
  const mockGenresService = {};
  const mockProductionCompaniesService = {};
  const mockSeasonsService = {};
  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: getRepositoryToken(Series),
          useValue: createMockRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
        {
          provide: GenresService,
          useValue: mockGenresService,
        },
        {
          provide: ProductionCompaniesService,
          useValue: mockProductionCompaniesService,
        },
        {
          provide: SeasonService,
          useValue: mockSeasonsService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<SeriesService>(SeriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
