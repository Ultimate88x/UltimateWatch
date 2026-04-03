/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { EpisodeController } from './episodes.controller';
import { EpisodeService } from './episodes.service';
import { EpisodeResponseDto } from './dto/episode-response-dto';

describe('EpisodeController', () => {
  let controller: EpisodeController;
  let service: jest.Mocked<EpisodeService>;

  const mockEpisodeService = {
    findOrCreate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpisodeController],
      providers: [
        {
          provide: EpisodeService,
          useValue: mockEpisodeService,
        },
      ],
    }).compile();

    controller = module.get<EpisodeController>(EpisodeController);
    service = module.get(EpisodeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEpisodesBySeasonTmdbId', () => {
    it('should call service.findOrCreate with correct parameters and return data', async () => {
      const seasonId = '123';
      const page = '2';
      const mockResponse = {
        data: [],
        total: 0,
        page: 2,
        lastPage: 1,
      } as unknown as EpisodeResponseDto;

      service.findOrCreate.mockResolvedValue(mockResponse);

      const result = await controller.getEpisodesBySeasonTmdbId(seasonId, page);

      expect(result).toEqual(mockResponse);

      expect(service.findOrCreate).toHaveBeenCalledWith(123, 2);
    });

    it('should use default page value if not provided', async () => {
      const seasonId = '123';

      await controller.getEpisodesBySeasonTmdbId(seasonId);

      expect(service.findOrCreate).toHaveBeenCalledWith(123, 1);
    });
  });
});
