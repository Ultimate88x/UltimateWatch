/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ResultsService } from './results.service';
import { EventsService } from 'src/events/events.service';
import { MediaService } from 'src/media/media.service';
import { EventMediaService } from 'src/event-media/event-media.service';
import { EventStatus } from 'src/common/enums/event.status.enum';

describe('ResultsService', () => {
  let service: ResultsService;

  const mockEventsService = {
    findExpiredAndVoting: jest.fn(),
    getResultsByEvent: jest.fn(),
    findVotingEventBydId: jest.fn(),
    saveVotingEvent: jest.fn(),
  };

  const mockMediaService = {
    findByTmdbId: jest.fn(),
  };

  const mockEventMediaService = {
    createMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: EventsService, useValue: mockEventsService },
        { provide: MediaService, useValue: mockMediaService },
        { provide: EventMediaService, useValue: mockEventMediaService },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleExpiredVotings', () => {
    it('should do nothing if there are no expired events', async () => {
      mockEventsService.findExpiredAndVoting.mockResolvedValue([]);
      await service.handleExpiredVotings();
      expect(mockEventsService.getResultsByEvent).not.toHaveBeenCalled();
    });

    it('should skip events with no proposed media', async () => {
      mockEventsService.findExpiredAndVoting.mockResolvedValue([
        { id: 1, proposedMedia: [] },
      ]);
      await service.handleExpiredVotings();
      expect(mockEventsService.getResultsByEvent).not.toHaveBeenCalled();
    });

    it('should process events with proposed media', async () => {
      const mockVotingResults = [
        { id: 100, title: 'Movie', imagePath: '', type: 'movie', count: 2 },
      ];
      const mockMedia = { id: 1, tmdbId: 100 };
      const mockEvent = {
        id: 1,
        proposedMedia: [{ tmdbId: 100 }],
        media: [],
        status: EventStatus.VOTING,
      } as any;
      const mockEventMediaList = [{ id: 1 }];

      mockEventsService.findExpiredAndVoting.mockResolvedValue([
        { id: 1, proposedMedia: [{ tmdbId: 100 }] },
      ]);
      mockEventsService.getResultsByEvent.mockResolvedValue(mockVotingResults);
      mockEventsService.findVotingEventBydId.mockResolvedValue(mockEvent);
      mockMediaService.findByTmdbId.mockResolvedValue(mockMedia);
      mockEventMediaService.createMany.mockResolvedValue(mockEventMediaList);
      mockEventsService.saveVotingEvent.mockResolvedValue(mockEvent);

      await service.handleExpiredVotings();

      expect(mockEventsService.getResultsByEvent).toHaveBeenCalledWith(1);
      expect(mockEventsService.saveVotingEvent).toHaveBeenCalledWith(
        expect.objectContaining({ status: EventStatus.WAITING }),
      );
    });
  });

  describe('processVotingClosure', () => {
    it('should close voting and set event to WAITING', async () => {
      const mockVotingResults = [
        { id: 100, title: 'Movie', imagePath: '', type: 'movie', count: 1 },
      ];
      const mockMedia = { tmdbId: 100 };
      const mockEvent = {
        id: 1,
        media: [],
        status: EventStatus.VOTING,
      } as any;
      const mockEventMediaList = [{ id: 1 }];

      mockEventsService.getResultsByEvent.mockResolvedValue(mockVotingResults);
      mockEventsService.findVotingEventBydId.mockResolvedValue(mockEvent);
      mockMediaService.findByTmdbId.mockResolvedValue(mockMedia);
      mockEventMediaService.createMany.mockResolvedValue(mockEventMediaList);
      mockEventsService.saveVotingEvent.mockResolvedValue(mockEvent);

      await service.processVotingClosure(1);

      expect(mockEvent.status).toBe(EventStatus.WAITING);
      expect(mockEvent.media).toEqual(mockEventMediaList);
    });
  });
});
