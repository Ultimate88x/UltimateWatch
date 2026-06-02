/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { EventMediaService } from './event-media.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventMedia } from './entities/event-media.entity';
import { Event } from '../events/entities/event.entity';
import { MembersService } from 'src/members/members.service';
import { EventMediaStatus } from 'src/common/enums/event.media.status.enum';

describe('EventMediaService', () => {
  let service: EventMediaService;

  const mockEventMediaRepository = {
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockMembersService = {
    getOwnerFromEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventMediaService,
        {
          provide: getRepositoryToken(EventMedia),
          useValue: mockEventMediaRepository,
        },
        { provide: MembersService, useValue: mockMembersService },
      ],
    }).compile();

    service = module.get<EventMediaService>(EventMediaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save an event media entry', async () => {
      const mockEvent = { id: 1, media: [] } as any;
      const mockMedia = { id: 1, tmdbId: 100 } as any;
      const mockEventMedia = {
        id: 1,
        event: mockEvent,
        media: mockMedia,
        status: EventMediaStatus.PENDING,
      };

      mockEventMediaRepository.create.mockReturnValue(mockEventMedia);
      mockEventMediaRepository.save.mockResolvedValue(mockEventMedia);

      const result = await service.create(mockEvent, mockMedia);

      expect(mockEventMediaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: EventMediaStatus.PENDING }),
      );
      expect(result).toEqual(mockEventMedia);
    });
  });

  describe('createMany', () => {
    it('should create multiple event media entries', async () => {
      const mockEvent = { id: 1, media: [] } as any;
      const mockMediaList = [{ id: 1 }, { id: 2 }] as any[];
      const mockEntries = mockMediaList.map((m, i) => ({
        id: i + 1,
        media: m,
      }));

      mockEventMediaRepository.create.mockImplementation((val) => val);
      mockEventMediaRepository.save.mockResolvedValue(mockEntries);

      const result = await service.createMany(mockEvent, mockMediaList);

      expect(mockEventMediaRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockEntries);
    });
  });

  describe('saveMany', () => {
    it('should save multiple event media entries', async () => {
      const mockList = [{ id: 1 }, { id: 2 }] as any[];
      mockEventMediaRepository.save.mockResolvedValue(mockList);

      const result = await service.saveMany(mockList);
      expect(result).toEqual(mockList);
    });
  });
});
