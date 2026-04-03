/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';
import { MediaType } from 'src/common/enums/media.type.enum';

describe('PersonController', () => {
  let controller: PersonController;
  let service: PersonService;

  const mockPersonService = {
    findCastByTmdbId: jest.fn(),
    findCrewByTmdbId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonController],
      providers: [
        {
          provide: PersonService,
          useValue: mockPersonService,
        },
      ],
    }).compile();

    controller = module.get<PersonController>(PersonController);
    service = module.get<PersonService>(PersonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Movies Endpoints', () => {
    it('getCastForMediaByMediaTmdbId should call service with MOVIE type', async () => {
      const tmdbId = '123';
      const page = 1;
      const limit = 6;

      await controller.getCastForMediaByMediaTmdbId(tmdbId, page, limit);

      expect(service.findCastByTmdbId).toHaveBeenCalledWith(
        +tmdbId,
        page,
        limit,
        MediaType.MOVIE,
      );
    });

    it('getCrewForMediaByMediaTmdbId should call service with MOVIE type', async () => {
      const tmdbId = '123';
      await controller.getCrewForMediaByMediaTmdbId(tmdbId, 2, 10);

      expect(service.findCrewByTmdbId).toHaveBeenCalledWith(
        123,
        2,
        10,
        MediaType.MOVIE,
      );
    });
  });

  describe('Series Endpoints', () => {
    it('getCastForSeriesByMediaTmdbId should call service with SERIES type', async () => {
      const tmdbId = '456';
      await controller.getCastForSeriesByMediaTmdbId(tmdbId, 1, 6);

      expect(service.findCastByTmdbId).toHaveBeenCalledWith(
        456,
        1,
        6,
        MediaType.SERIES,
      );
    });

    it('getCrewForSeriesByMediaTmdbId should call service with SERIES type', async () => {
      const tmdbId = '456';
      await controller.getCrewForSeriesByMediaTmdbId(tmdbId, 1, 6);

      expect(service.findCrewByTmdbId).toHaveBeenCalledWith(
        456,
        1,
        6,
        MediaType.SERIES,
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle default parameters if page and limit are missing', async () => {
      // Aunque en NestJS los @Query definen los valores por defecto,
      // aquí probamos la lógica de llamada directa del método.
      await controller.getCastForMediaByMediaTmdbId('123');

      expect(service.findCastByTmdbId).toHaveBeenCalledWith(
        123,
        1, // Default page
        6, // Default limit
        MediaType.MOVIE,
      );
    });
  });
});
