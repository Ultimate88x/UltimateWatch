import { Test, TestingModule } from '@nestjs/testing';
import { SeasonService } from './seasons.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { Season } from './entities/seasons.entity';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('SeasonService', () => {
  let service: SeasonService;

  const createMockRepository = (): MockRepository<Season> => ({});

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonService,
        {
          provide: getRepositoryToken(Season),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<SeasonService>(SeasonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
