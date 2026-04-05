import { Test, TestingModule } from '@nestjs/testing';
import { PersonService } from './person.service';
import { Person } from './entities/person.entity';
import { MediaPerson } from './entities/media.person.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { MediaContentsService } from 'src/media/media.service';
import { ObjectLiteral, Repository } from 'typeorm';
import { MediaType } from 'src/common/enums/media.type.enum';
import { PersonType } from 'src/common/enums/person.type.enum';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { TmdbPeopleResponseDto } from 'src/common/tmdbapi/dto/tmdb-people-response-dto';
import { MediaCastDto } from './dto/media-cast-dto';
import { MediaCrewDto } from './dto/media-crew-dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('PersonService', () => {
  let service: PersonService;
  let personRepo: MockRepository<Person>;
  let mediaPersonRepo: MockRepository<MediaPerson>;

  const mockTmdbApiService = {
    getMediaPeople: jest.fn(),
  };
  const mockMediaContentsService = {
    findByTmdbId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: getRepositoryToken(Person),
          useValue: {
            findOne: jest.fn(),
            upsert: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MediaPerson),
          useValue: {
            find: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            upsert: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
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
    personRepo = module.get(getRepositoryToken(Person));
    mediaPersonRepo = module.get(getRepositoryToken(MediaPerson));

    jest.clearAllMocks();

    mockTmdbApiService.getMediaPeople.mockResolvedValue({ cast: [], crew: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findCastByTmdbId', () => {
    it('should return a paginated cast list', async () => {
      const mockCast = [
        {
          person: { name: 'Actor 1', profilePath: '/p1.jpg' },
          character: 'Hero',
          episodeCount: 1,
          type: PersonType.CAST,
          updatedAt: new Date(),
        },
      ];

      jest
        .spyOn(service, 'findPeopleForMediaByTmdbId')
        .mockResolvedValue(
          mockCast as unknown as MediaPerson[] | Promise<MediaPerson[]>,
        );

      (mediaPersonRepo.findAndCount as jest.Mock).mockResolvedValue([
        mockCast,
        1,
      ]);

      const result = await service.findCastByTmdbId(123, 1, 6, MediaType.MOVIE);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].name).toBe('Actor 1');
    });
  });

  describe('findCrewByTmdbId', () => {
    it('should use query builder and return prioritized crew', async () => {
      const mockCrew = [
        {
          person: { name: 'Director 1', profilePath: '/d1.jpg' },
          job: 'Director',
          episodeCount: 0,
          type: PersonType.CREW,
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCrew, 1]),
      };

      jest
        .spyOn(service, 'findPeopleForMediaByTmdbId')
        .mockResolvedValue(mockCrew as unknown as MediaPerson[]);
      (mediaPersonRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findCrewByTmdbId(123, 1, 6, MediaType.MOVIE);

      expect(result.data[0].job).toBe('Director');
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
    });
  });

  describe('findOrCreate', () => {
    const personData = { tmdbId: 10, name: 'Cillian Murphy' } as Person;
    const mockPeopleInfo = {
      cast: [{ id: 10, character: 'Oppenheimer', order: 1 }],
      crew: [],
    };

    it('should throw ResourceNotFoundException if person is not in TMDB info', async () => {
      (personRepo.findOne as jest.Mock).mockResolvedValue(personData);
      mockMediaContentsService.findByTmdbId.mockResolvedValue({
        id: 1,
      });

      await expect(
        service.findOrCreate(
          999,
          500,
          personData,
          mockPeopleInfo as unknown as TmdbPeopleResponseDto,
        ),
      ).rejects.toThrow(ResourceNotFoundException);
    });

    it('should upsert and return MediaCastDto', async () => {
      const mockMediaContent = { id: 1, tmdbId: 500 };
      const mockSavedMediaPerson = {
        type: PersonType.CAST,
        person: personData,
        character: 'Oppenheimer',
        episodeCount: 0,
      };

      (personRepo.upsert as jest.Mock).mockResolvedValue(undefined);
      (personRepo.findOne as jest.Mock).mockResolvedValue(personData);
      mockMediaContentsService.findByTmdbId.mockResolvedValue(mockMediaContent);
      (mediaPersonRepo.upsert as jest.Mock).mockResolvedValue(undefined);
      (mediaPersonRepo.findOne as jest.Mock).mockResolvedValue(
        mockSavedMediaPerson,
      );

      const result: MediaCastDto = (await service.findOrCreate(
        10,
        500,
        personData,
        mockPeopleInfo as unknown as TmdbPeopleResponseDto,
      )) as MediaCastDto;

      expect(result.character).toBe('Oppenheimer');
      expect(mediaPersonRepo.upsert).toHaveBeenCalled();
    });
  });

  describe('ensurePeopleAreLoaded', () => {
    it('should skip TMDB call if data is fresh', async () => {
      const freshPeople = [{ updatedAt: new Date() }];
      jest
        .spyOn(service, 'findPeopleForMediaByTmdbId')
        .mockResolvedValue(
          freshPeople as unknown as MediaPerson[] | Promise<MediaPerson[]>,
        );

      jest
        .spyOn(service, 'findPeopleForMediaByTmdbId')
        .mockResolvedValue(freshPeople as unknown as MediaPerson[]);

      await service.ensurePeopleAreLoaded(123, MediaType.MOVIE);

      expect(mockTmdbApiService.getMediaPeople).not.toHaveBeenCalled();
    });

    it('should call TMDB if no data exists', async () => {
      jest
        .spyOn(service, 'findOrCreate')
        .mockResolvedValue(
          {} as unknown as
            | MediaCastDto
            | MediaCrewDto
            | Promise<MediaCastDto | MediaCrewDto>,
        );
      jest.spyOn(service, 'findPeopleForMediaByTmdbId').mockResolvedValue([]);
      mockTmdbApiService.getMediaPeople.mockResolvedValue({
        cast: [],
        crew: [],
      });

      await service.ensurePeopleAreLoaded(123, MediaType.MOVIE);

      expect(mockTmdbApiService.getMediaPeople).toHaveBeenCalled();
    });
  });
});
