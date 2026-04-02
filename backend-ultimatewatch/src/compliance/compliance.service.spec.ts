import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { MediaProvider } from 'src/providers/entities/media.provider.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';
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

  const createMediaProviderMockRepository =
    (): MockRepository<MediaProvider> => ({});
  const createProviderMockRepository = (): MockRepository<Provider> => ({});
  const createMediaContentMockRepository =
    (): MockRepository<MediaContent> => ({});
  const createPersonMockRepository = (): MockRepository<Person> => ({});

  const mockGenresService = {};
  const mockProductionCompaniesService = {};

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
          provide: getRepositoryToken(MediaContent),
          useValue: createMediaContentMockRepository(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
