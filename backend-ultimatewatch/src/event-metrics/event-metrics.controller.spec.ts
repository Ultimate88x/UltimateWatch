/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { EventMetricsController } from './event-metrics.controller';
import { EventMetricsService } from './event-metrics.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EventMetricsDto } from './dto/event-metrics-dto';
import { UserMetricsDto } from './dto/user-metrics-dto';

describe('EventMetricsController', () => {
  let controller: EventMetricsController;
  let service: EventMetricsService;

  const mockEventMetricsService = {
    getEventStatistics: jest.fn(),
    getUserStatistics: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventMetricsController],
      providers: [
        {
          provide: EventMetricsService,
          useValue: mockEventMetricsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<EventMetricsController>(EventMetricsController);
    service = module.get<EventMetricsService>(EventMetricsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEventStatistics', () => {
    const userId = 1;
    const eventIdParam = '10';
    const numericEventId = 10;

    it('should call eventMetricsService.getEventStatistics with userId and numeric eventId', async () => {
      const expectedMetrics = {
        totalAttendees: 150,
        averageRating: 4.8,
      } as unknown as EventMetricsDto;

      mockEventMetricsService.getEventStatistics.mockResolvedValue(
        expectedMetrics,
      );

      const result = await controller.getEventStatistics(userId, eventIdParam);

      expect(service.getEventStatistics).toHaveBeenCalledWith(
        userId,
        numericEventId,
      );
      expect(result).toEqual(expectedMetrics);
    });

    it('should propagate errors from the service', async () => {
      mockEventMetricsService.getEventStatistics.mockRejectedValue(
        new Error('ResourceNotFoundException'),
      );

      await expect(
        controller.getEventStatistics(userId, eventIdParam),
      ).rejects.toThrow('ResourceNotFoundException');
    });
  });

  describe('getUserStatistics', () => {
    const userIdParam = '1';
    const numericUserId = 1;

    it('should call eventMetricsService.getUserStatistics with numeric userId', async () => {
      const expectedMetrics = {
        eventsAttended: 12,
        eventsCreated: 3,
      } as unknown as UserMetricsDto;

      mockEventMetricsService.getUserStatistics.mockResolvedValue(
        expectedMetrics,
      );

      const result = await controller.getUserStatistics(userIdParam);

      expect(service.getUserStatistics).toHaveBeenCalledWith(numericUserId);
      expect(result).toEqual(expectedMetrics);
    });

    it('should propagate errors from the service', async () => {
      mockEventMetricsService.getUserStatistics.mockRejectedValue(
        new Error('ResourceNotFoundException'),
      );

      await expect(controller.getUserStatistics(userIdParam)).rejects.toThrow(
        'ResourceNotFoundException',
      );
    });
  });
});
