import { Test, TestingModule } from '@nestjs/testing';
import { EpisodeController } from './episodes.controller';
import { EpisodeService } from './episodes.service';

describe('EpisodeController', () => {
  let controller: EpisodeController;

  const mockEpisodeService = {};

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
