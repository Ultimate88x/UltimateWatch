import { Test, TestingModule } from '@nestjs/testing';
import { ProductionCompaniesService } from './production-companies.service';
import { ProductionCompany } from './entities/production-company.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ProductionCompaniesService', () => {
  let service: ProductionCompaniesService;
  let repository: MockRepository<ProductionCompany>;

  const createMockRepository = (): MockRepository<ProductionCompany> => ({
    findOne: jest.fn(),
    upsert: jest.fn(),
    find: jest.fn(),
  });

  const mockTmdbApiService = {
    getProductionCompanyFromTmdb: jest.fn(),
  };

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
    repository = module.get(getRepositoryToken(ProductionCompany));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByTmdbId', () => {
    it('should return a production company if it exists', async () => {
      const mockCompany = {
        tmdbId: 1,
        name: 'Warner Bros.',
      } as ProductionCompany;
      repository.findOne?.mockResolvedValue(mockCompany);

      const result = await service.findByTmdbId(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { tmdbId: 1 } });
      expect(result).toEqual(mockCompany);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      repository.findOne?.mockResolvedValue(null);

      await expect(service.findByTmdbId(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('upsert', () => {
    it('should upsert and return the found entity', async () => {
      const companyData = { tmdbId: 10, name: 'Disney' } as ProductionCompany;
      repository.upsert?.mockResolvedValue(undefined);
      repository.findOne?.mockResolvedValue(companyData);

      const result = await service.upsert(companyData);

      expect(repository.upsert).toHaveBeenCalledWith(companyData, ['tmdbId']);
      expect(result).toEqual(companyData);
    });
  });

  describe('refreshTmdbProductionCompanies', () => {
    it('should refresh stale companies and return the count', async () => {
      const limitDate = new Date();
      const storedCompanies = [{ tmdbId: 1 }, { tmdbId: 2 }];
      const freshTmdbData = {
        id: 1,
        name: 'Fresh Name',
        logo_path: '/path.png',
      };

      repository.find?.mockResolvedValue(storedCompanies);
      mockTmdbApiService.getProductionCompanyFromTmdb.mockResolvedValue(
        freshTmdbData,
      );

      const mapperSpy = jest
        .spyOn(TmdbApiMapper, 'tmdbProductionCompanyDtoToProductionCompany')
        .mockReturnValue({
          tmdbId: 1,
          name: 'Fresh Name',
        } as ProductionCompany);

      repository.upsert?.mockResolvedValue(undefined);

      const count = await service.refreshTmdbProductionCompanies(limitDate);

      expect(repository.find).toHaveBeenCalled();
      expect(
        mockTmdbApiService.getProductionCompanyFromTmdb,
      ).toHaveBeenCalledTimes(2);
      expect(repository.upsert).toHaveBeenCalled();
      expect(count).toBe(2);

      mapperSpy.mockRestore();
    });

    it('should return 0 if no companies need refreshing', async () => {
      repository.find?.mockResolvedValue([]);

      const count = await service.refreshTmdbProductionCompanies(new Date());

      expect(count).toBe(0);
      expect(repository.upsert).toHaveBeenCalledWith([], ['tmdbId']);
    });
  });
});
