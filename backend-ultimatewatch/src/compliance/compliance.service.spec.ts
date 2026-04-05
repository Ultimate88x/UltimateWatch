/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { MediaProvider } from 'src/providers/entities/media.provider.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { Media } from 'src/media/entities/media.entity';
import { Person } from 'src/person/entities/person.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { ObjectLiteral, Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ComplianceService', () => {
  let service: ComplianceService;
  let mediaProviderRepo: MockRepository<MediaProvider>;
  let providerRepo: MockRepository<Provider>;
  let mediaRepo: MockRepository<Media>;
  let personRepo: MockRepository<Person>;
  let genresService: jest.Mocked<GenresService>;
  let productionCompaniesService: jest.Mocked<ProductionCompaniesService>;

  const createMediaProviderMockRepository =
    (): MockRepository<MediaProvider> => ({
      update: jest.fn().mockResolvedValue({ affected: 10 }),
    });
  const createProviderMockRepository = (): MockRepository<Provider> => ({
    delete: jest.fn().mockResolvedValue({ affected: 5 }),
  });
  const createmediaMockRepository = (): MockRepository<Media> => ({
    delete: jest.fn().mockResolvedValue({ affected: 5 }),
  });
  const createPersonMockRepository = (): MockRepository<Person> => ({
    delete: jest.fn().mockResolvedValue({ affected: 20 }),
  });

  const mockGenresService = {
    storeTmdbGenres: jest.fn().mockResolvedValue(10),
  };
  const mockProductionCompaniesService = {
    refreshTmdbProductionCompanies: jest.fn().mockResolvedValue(5),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: getRepositoryToken(MediaProvider),
          useValue: createMediaProviderMockRepository(),
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: createProviderMockRepository(),
        },
        {
          provide: getRepositoryToken(Media),
          useValue: createmediaMockRepository(),
        },
        {
          provide: getRepositoryToken(Person),
          useValue: createPersonMockRepository(),
        },
        {
          provide: GenresService,
          useValue: mockGenresService,
        },
        {
          provide: ProductionCompaniesService,
          useValue: mockProductionCompaniesService,
        },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
    mediaProviderRepo = module.get(getRepositoryToken(MediaProvider));
    providerRepo = module.get(getRepositoryToken(Provider));
    mediaRepo = module.get(getRepositoryToken(Media));
    personRepo = module.get(getRepositoryToken(Person));
    genresService = module.get(GenresService);
    productionCompaniesService = module.get(ProductionCompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purgeObsoleteData', () => {
    it('should orchestrate the full purge and refresh process', async () => {
      const purgeWatchmodeSpy = jest.spyOn(
        service as any,
        'purgeWatchmodeLinks',
      );
      const purgeTmdbSpy = jest.spyOn(service as any, 'purgeTmdbData');
      const purgePeopleSpy = jest.spyOn(service as any, 'purgePeopleData');
      const refreshTmdbSpy = jest.spyOn(service as any, 'refreshTmdbData');

      await service.purgeObsoleteData();

      expect(purgeWatchmodeSpy).toHaveBeenCalled();
      expect(purgeTmdbSpy).toHaveBeenCalled();
      expect(purgePeopleSpy).toHaveBeenCalled();
      expect(refreshTmdbSpy).toHaveBeenCalled();
    });
  });

  describe('Internal Purge Methods', () => {
    it('purgeWatchmodeLinks should call update on mediaProviderRepository', async () => {
      await service['purgeWatchmodeLinks']();
      expect(mediaProviderRepo.update).toHaveBeenCalled();
    });

    it('purgeTmdbData should call delete on media and provider repositories', async () => {
      await service['purgeTmdbData']();
      expect(mediaRepo.delete).toHaveBeenCalled();
      expect(providerRepo.delete).toHaveBeenCalled();
    });

    it('purgePeopleData should call delete on personRepository', async () => {
      await service['purgePeopleData']();
      expect(personRepo.delete).toHaveBeenCalled();
    });

    it('refreshTmdbData should call genres and productionCompanies services', async () => {
      await service['refreshTmdbData']();
      expect(genresService.storeTmdbGenres).toHaveBeenCalled();
      expect(
        productionCompaniesService.refreshTmdbProductionCompanies,
      ).toHaveBeenCalled();
    });
  });
});
