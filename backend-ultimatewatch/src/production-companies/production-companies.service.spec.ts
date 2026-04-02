import { Test, TestingModule } from '@nestjs/testing';
import { ProductionCompaniesService } from './production-companies.service';
import { ProductionCompany } from './entities/production-company.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { ObjectLiteral, Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ProductionCompaniesService', () => {
  let service: ProductionCompaniesService;

  const createMockRepository = (): MockRepository<ProductionCompany> => ({});

  const mockTmdbApiService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionCompaniesService,
        {
          provide: getRepositoryToken(ProductionCompany),
          useValue: createMockRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
      ],
    }).compile();

    service = module.get<ProductionCompaniesService>(
      ProductionCompaniesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
