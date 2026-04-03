import { Test, TestingModule } from '@nestjs/testing';
import { SeasonController } from './seasons.controller';
import { SeasonService } from './seasons.service';
import { SeasonDetailDto } from './dto/season-detail-dto';

describe('SeasonController', () => {
  let controller: SeasonController;

  const mockSeasonService = {
    findSeasonDetailDtoBySeriesIdAndNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonController],
      providers: [
        {
          provide: SeasonService,
          useValue: mockSeasonService,
        },
      ],
    }).compile();

    controller = module.get<SeasonController>(SeasonController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSeasonByTmdbId', () => {
    const mockSeasonDetail: SeasonDetailDto = {
      tmdbId: 12345,
      title: 'Season 1',
      overview: 'Test overview',
      imagePath: '/path.jpg',
      number: 1,
      releaseDate: '2024-01-01T00:00:00.000Z',
    };

    it('should return season details from the service', async () => {
      const seriesId = '500';
      const seasonNumber = '1';

      mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber.mockResolvedValue(
        mockSeasonDetail,
      );

      const result = await controller.getSeasonByTmdbId(seriesId, seasonNumber);

      expect(
        mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber,
      ).toHaveBeenCalledWith(500, 1);

      expect(result).toEqual(mockSeasonDetail);
    });

    it('should propagate errors from the service', async () => {
      const seriesId = '500';
      const seasonNumber = '1';

      mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber.mockRejectedValue(
        new Error('Season not found'),
      );

      await expect(
        controller.getSeasonByTmdbId(seriesId, seasonNumber),
      ).rejects.toThrow('Season not found');
    });

    it('should handle numeric strings correctly via unary plus', async () => {
      const seriesId = '99';
      const seasonNumber = '0';

      mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber.mockResolvedValue(
        mockSeasonDetail,
      );

      await controller.getSeasonByTmdbId(seriesId, seasonNumber);

      expect(
        mockSeasonService.findSeasonDetailDtoBySeriesIdAndNumber,
      ).toHaveBeenCalledWith(99, 0);
    });
  });
});
