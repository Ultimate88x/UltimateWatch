/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { EpisodeService } from './episodes.service';
import { Episode } from './entities/episode.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { SeasonService } from 'src/seasons/seasons.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { Season } from 'src/seasons/entities/seasons.entity';
import { EpisodeResponseDto } from './dto/episode-response-dto';
import { TmdbSeasonDto } from 'src/common/tmdbapi/dto/media/tmdb-season-dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('EpisodeService', () => {
  let service: EpisodeService;
  let episodeRepo: MockRepository<Episode>;

  let seasonsService: jest.Mocked<SeasonService>;
  let tmdbApiService: jest.Mocked<TmdbApiService>;

  const createMockRepository = (): MockRepository<Episode> => ({
    findAndCount: jest.fn(),
    upsert: jest.fn(),
  });

  const mockTmdbApiService = {
    getSeasonFromTmdb: jest.fn(),
  };

  const mockSeasonsService = {
    findByTmdbId: jest.fn(),
    save: jest.fn(),
  };

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
    episodeRepo = module.get(getRepositoryToken(Episode));

    seasonsService = module.get(SeasonService);
    tmdbApiService = module.get(TmdbApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findFromSeasonByTmdbId', () => {
    it('should return a paginated list of episodes', async () => {
      const mockEpisodes = [
        { tmdbId: 1, title: 'Episode 1', releaseDate: new Date() },
      ];
      episodeRepo.findAndCount?.mockResolvedValue([mockEpisodes, 1]);

      const result = await service.findFromSeasonByTmdbId(100, 1, 10);

      expect(result).toBeInstanceOf(EpisodeResponseDto);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(episodeRepo.findAndCount).toHaveBeenCalledWith({
        where: { season: { tmdbId: 100 } },
        take: 10,
        skip: 0,
      });
    });

    it('should return an empty response if no episodes are found', async () => {
      episodeRepo.findAndCount?.mockResolvedValue([[], 0]);

      const result = await service.findFromSeasonByTmdbId(100);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOrCreate', () => {
    const mockSeason = {
      tmdbId: 100,
      number: 1,
      uniqueLastRetrieved: new Date(),
      getEpisodeNumber: () => 10,
      series: { media: { tmdbId: 50 } },
    } as unknown as Season;

    it('should skip TMDB call if data is fresh', async () => {
      seasonsService.findByTmdbId.mockResolvedValue(mockSeason);

      jest
        .spyOn(service, 'findFromSeasonByTmdbId')
        .mockResolvedValue(
          new EpisodeResponseDto({ data: [], total: 0, page: 1, lastPage: 1 }),
        );

      await service.findOrCreate(100);

      expect(tmdbApiService.getSeasonFromTmdb).not.toHaveBeenCalled();
      expect(service.findFromSeasonByTmdbId).toHaveBeenCalledWith(100, 1, 10);
    });

    it('should call TMDB and upsert episodes if data is stale', async () => {
      const staleSeason = {
        ...mockSeason,
        uniqueLastRetrieved: new Date(Date.now() - 3600 * 1000 * 48),
      } as unknown as Season;

      const mockTmdbData = {
        episodes: [
          { id: 1, name: 'New Ep', overview: '...', episode_number: 1 },
        ],
      } as TmdbSeasonDto | Promise<TmdbSeasonDto>;

      seasonsService.findByTmdbId.mockResolvedValue(staleSeason);
      tmdbApiService.getSeasonFromTmdb.mockResolvedValue(mockTmdbData);

      jest
        .spyOn(service, 'findFromSeasonByTmdbId')
        .mockResolvedValue(
          {} as unknown as EpisodeResponseDto | Promise<EpisodeResponseDto>,
        );

      await service.findOrCreate(100);

      expect(tmdbApiService.getSeasonFromTmdb).toHaveBeenCalled();
      expect(episodeRepo.upsert).toHaveBeenCalled();
      expect(seasonsService.save).toHaveBeenCalled();
    });
  });
});
