import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { HttpModule } from '@nestjs/axios';

describe('MoviesController', () => {
  let controller: MoviesController;

  const mockTmdbApiService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [MoviesController],
      providers: [
        MoviesService,
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
