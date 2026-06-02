import { Test, TestingModule } from '@nestjs/testing';
import { EventMetricsService } from './event-metrics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventMetric } from './entities/event-metric.entity';
import { EventsService } from 'src/events/events.service';
import { CommentsService } from 'src/comments/comments.service';
import { MembersService } from 'src/members/members.service';
import { UsersService } from 'src/users/users.service';
import { VotesService } from 'src/votes/votes.service';
import { EventGateway } from 'src/websockets/event.gateway';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventStatus } from 'src/common/enums/event.status.enum';

describe('EventMetricsService', () => {
  let service: EventMetricsService;

  const mockEventMetricsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockEventsService = {
    getActiveEvents: jest.fn(),
    findBydId: jest.fn(),
    getCreatedEventsByUser: jest.fn(),
  };

  const mockCommentsService = {
    countFromEvent: jest.fn(),
    countFromUser: jest.fn(),
  };

  const mockMembersService = {
    getOwnerFromEvent: jest.fn(),
    countTotalUniqueFromEvent: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockVotesService = {
    countFromUser: jest.fn(),
  };

  const mockEventGateway = {
    server: {
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([]),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventMetricsService,
        {
          provide: getRepositoryToken(EventMetric),
          useValue: mockEventMetricsRepository,
        },
        { provide: EventsService, useValue: mockEventsService },
        { provide: CommentsService, useValue: mockCommentsService },
        { provide: MembersService, useValue: mockMembersService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: VotesService, useValue: mockVotesService },
        { provide: EventGateway, useValue: mockEventGateway },
      ],
    }).compile();

    service = module.get<EventMetricsService>(EventMetricsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEventStatistics', () => {
    it('should throw ForbiddenException if user is not the event owner', async () => {
      mockEventsService.findBydId.mockResolvedValue({
        id: 1,
        status: EventStatus.FINISHED,
        endDate: new Date(),
        startDate: new Date(),
        eventDate: new Date(),
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });

      await expect(service.getEventStatistics(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if event is not finished', async () => {
      mockEventsService.findBydId.mockResolvedValue({
        id: 1,
        status: EventStatus.STARTED,
        endDate: null,
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });

      await expect(service.getEventStatistics(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 1 });
      mockEventsService.getCreatedEventsByUser.mockResolvedValue({ total: 5 });
      mockVotesService.countFromUser.mockResolvedValue(10);
      mockCommentsService.countFromUser.mockResolvedValue(3);

      const result = await service.getUserStatistics(1);

      expect(result).toEqual(
        expect.objectContaining({ createdEvents: 5, votes: 10, messages: 3 }),
      );
    });
  });
});
