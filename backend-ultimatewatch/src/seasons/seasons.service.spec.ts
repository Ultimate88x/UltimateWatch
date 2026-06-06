import { Test, TestingModule } from '@nestjs/testing';
import { SeasonService } from './seasons.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { Season } from './entities/seasons.entity';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('SeasonService', () => {
  let service: SeasonService;
  let repository: MockRepository<Season>;

  const createMockRepository = (): MockRepository<Season> => ({
    findOne: jest.fn(),
    save: jest.fn(),
    upsert: jest.fn(),
  });

  const mockSeason: Season = {
    tmdbId: 123,
    title: 'Season 1',
    overview: 'The beginning',
    imagePath: '/path.jpg',
    number: 1,
    releaseDate: new Date('2024-01-01'),
  } as Season;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonService,
        {
          provide: getRepositoryToken(Season),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<SeasonService>(SeasonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('should save and return a season', async () => {
      repository.save?.mockResolvedValue(mockSeason);
      const result = await service.save(mockSeason);
      expect(repository.save).toHaveBeenCalledWith(mockSeason);
      expect(result).toEqual(mockSeason);
    });
  });

  describe('getByTmdbId', () => {
    it('should return a season if found', async () => {
      repository.findOne?.mockResolvedValue(mockSeason);

      const result = await service.getByTmdbId(123);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { tmdbId: 123 },
        relations: ['series'],
      });
      expect(result).toEqual(mockSeason);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.getByTmdbId(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findSeasonDetailDtoBySeriesIdAndNumber', () => {
    it('should return a SeasonDetailDto if found', async () => {
      repository.findOne?.mockResolvedValue(mockSeason);

      const result = await service.findSeasonDetailDtoBySeriesIdAndNumber(1, 1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { series: { tmdbId: 1 }, number: 1 },
      });
      expect(result.tmdbId).toBe(mockSeason.tmdbId);
      expect(result.releaseDate).toBe(mockSeason.releaseDate?.toISOString());
    });

    it('should handle releaseDate as a string correctly', async () => {
      const seasonWithStringDate = {
        ...mockSeason,
        releaseDate: '2024-05-01',
      } as unknown as Season;

      repository.findOne?.mockResolvedValue(seasonWithStringDate);

      const result = await service.findSeasonDetailDtoBySeriesIdAndNumber(1, 1);
      expect(result.releaseDate).toBe(new Date('2024-05-01').toISOString());
    });

    it('should return null for releaseDate if it is missing', async () => {
      const seasonNoDate = { ...mockSeason, releaseDate: null } as Season;
      repository.findOne?.mockResolvedValue(seasonNoDate);

      const result = await service.findSeasonDetailDtoBySeriesIdAndNumber(1, 1);
      expect(result.releaseDate).toBeNull();
    });

    it('should throw ResourceNotFoundException if season is not found', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(
        service.findSeasonDetailDtoBySeriesIdAndNumber(1, 1),
      ).rejects.toThrow(ResourceNotFoundException);
    });
  });

  describe('upsert', () => {
    it('should call upsert and return the found season', async () => {
      repository.upsert?.mockResolvedValue(undefined);
      repository.findOne?.mockResolvedValue(mockSeason);

      const result = await service.upsert(mockSeason);

      expect(repository.upsert).toHaveBeenCalledWith(mockSeason, ['tmdbId']);
      expect(repository.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockSeason);
    });
  });
});
