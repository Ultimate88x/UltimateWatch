import { Test, TestingModule } from '@nestjs/testing';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { HttpModule } from '@nestjs/axios';
import { ProvidersService } from 'src/providers/providers.service';

describe('SeriesController', () => {
  let controller: SeriesController;

  const mockSeriesService = {};
  const mockProvidersService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [SeriesController],
      providers: [
        {
          provide: SeriesService,
          useValue: mockSeriesService,
        },
        {
          provide: ProvidersService,
          useValue: mockProvidersService,
        },
      ],
    }).compile();

    controller = module.get<SeriesController>(SeriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
