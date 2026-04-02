import { Test, TestingModule } from '@nestjs/testing';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { ObjectLiteral, Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('GenresService', () => {
  let service: GenresService;

  const createMockRepository = (): MockRepository<Genre> => ({});

  const mockTmdbApiService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        {
          provide: getRepositoryToken(Genre),
          useValue: createMockRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
