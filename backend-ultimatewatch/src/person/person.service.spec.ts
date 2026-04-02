import { Test, TestingModule } from '@nestjs/testing';
import { PersonService } from './person.service';
import { Person } from './entities/person.entity';
import { MediaPerson } from './entities/media.person.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { MediaContentsService } from 'src/media-contents/media-contents.service';
import { ObjectLiteral, Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('PersonService', () => {
  let service: PersonService;

  const createMockPersonRepository = (): MockRepository<Person> => ({});
  const createMockMediaPersonRepository =
    (): MockRepository<MediaPerson> => ({});

  const mockTmdbApiService = {};
  const mockMediaContentsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: getRepositoryToken(Person),
          useValue: createMockPersonRepository(),
        },
        {
          provide: getRepositoryToken(MediaPerson),
          useValue: createMockMediaPersonRepository(),
        },
        {
          provide: TmdbApiService,
          useValue: mockTmdbApiService,
        },
        {
          provide: MediaContentsService,
          useValue: mockMediaContentsService,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
