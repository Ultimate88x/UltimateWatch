import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { MediaProvider } from './entities/media.provider.entity';
import { ObjectLiteral, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { WatchmodeService } from 'src/common/watchmode/watchmode.service';
import { MediaContentsService } from 'src/media-contents/media-contents.service';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ProvidersService', () => {
  let service: ProvidersService;

  const createMockProvidersRepository = (): MockRepository<Provider> => ({});
  const createMockMediaProvidersRepository =
    (): MockRepository<MediaProvider> => ({});

  const mockTmdbApiService = {};
  const mockWatchmodeService = {};
  const mockMediaContentsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: getRepositoryToken(Provider),
          useValue: createMockProvidersRepository(),
        },
        {
          provide: getRepositoryToken(MediaProvider),
          useValue: createMockMediaProvidersRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
        {
          provide: WatchmodeService,
          useValue: mockWatchmodeService,
        },
        {
          provide: MediaContentsService,
          useValue: mockMediaContentsService,
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
