/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { StandardEvent } from './entities/standard-event.entity';
import { VotingEvent } from './entities/voting-event.entity';
import { Media } from 'src/media/entities/media.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { MediaService } from 'src/media/media.service';
import { EventMediaService } from 'src/event-media/event-media.service';
import { MembersService } from 'src/members/members.service';
import { SeasonService } from 'src/seasons/seasons.service';
import { EpisodeService } from 'src/episodes/episodes.service';
import { RequestsService } from 'src/requests/requests.service';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventType } from 'src/common/enums/event.type.enum';
import { EventVisibility } from 'src/common/enums/event.visibility.enum';
import { MemberRole } from 'src/common/enums/member.role.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventMediaStatus } from 'src/common/enums/event.media.status.enum';

describe('EventsService', () => {
  let service: EventsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    subQuery: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('subquery'),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
  };

  const mockEventsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockStandardEventsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    merge: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockVotingEventsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    merge: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockMediaRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockUsersRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockUsersService = { findById: jest.fn() };
  const mockMediaService = { findByTmdbId: jest.fn() };
  const mockEventMediaService = {
    create: jest.fn(),
    createMany: jest.fn(),
    saveMany: jest.fn(),
  };
  const mockMembersService = {
    getOwnerFromEvent: jest.fn(),
    findByUserIdAndEventId: jest.fn(),
    getByUserIdAndEventId: jest.fn(),
    countFromEvent: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const mockSeasonsService = {
    findByTmdbId: jest.fn(),
    getByTmdbId: jest.fn(),
  };
  const mockEpisodesService = {
    findByTmdbId: jest.fn(),
    getByTmdbId: jest.fn(),
  };
  const mockRequestsService = {
    isFriendsWithUser: jest.fn(),
    findActiveEventInviteRequestBetweenUsers: jest.fn(),
    createEventInviteRequest: jest.fn(),
    findEventInviteRequestById: jest.fn(),
    findEventRequestsFromUser: jest.fn(),
    resolveRequest: jest.fn(),
    findEventAccessRequestById: jest.fn(),
    createEventAccessRequest: jest.fn(),
    findActiveEventAccessRequestsFromEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: mockEventsRepository },
        {
          provide: getRepositoryToken(StandardEvent),
          useValue: mockStandardEventsRepository,
        },
        {
          provide: getRepositoryToken(VotingEvent),
          useValue: mockVotingEventsRepository,
        },
        { provide: getRepositoryToken(Media), useValue: mockMediaRepository },
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MediaService, useValue: mockMediaService },
        { provide: EventMediaService, useValue: mockEventMediaService },
        { provide: MembersService, useValue: mockMembersService },
        { provide: SeasonService, useValue: mockSeasonsService },
        { provide: EpisodeService, useValue: mockEpisodesService },
        { provide: RequestsService, useValue: mockRequestsService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBydId', () => {
    it('should return an event if found', async () => {
      const mockEvent = {
        id: 1,
        status: EventStatus.WAITING,
        members: [],
        media: [],
      } as any;
      mockEventsRepository.findOne.mockResolvedValue(mockEvent);
      expect(await service.findBydId(1)).toEqual(mockEvent);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      mockEventsRepository.findOne.mockResolvedValue(null);
      await expect(service.findBydId(99)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findStandardEventBydId', () => {
    it('should return a standard event if found', async () => {
      const mockEvent = { id: 1 } as any;
      mockStandardEventsRepository.findOne.mockResolvedValue(mockEvent);
      expect(await service.findStandardEventBydId(1)).toEqual(mockEvent);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue(null);
      await expect(service.findStandardEventBydId(99)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findVotingEventBydId', () => {
    it('should return a voting event if found', async () => {
      const mockEvent = { id: 1 } as any;
      mockVotingEventsRepository.findOne.mockResolvedValue(mockEvent);
      expect(await service.findVotingEventBydId(1)).toEqual(mockEvent);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      mockVotingEventsRepository.findOne.mockResolvedValue(null);
      await expect(service.findVotingEventBydId(99)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findExpiredAndVoting', () => {
    it('should return expired voting events', async () => {
      const mockEvents = [{ id: 1 }, { id: 2 }] as any[];
      mockVotingEventsRepository.find.mockResolvedValue(mockEvents);
      expect(await service.findExpiredAndVoting()).toEqual(mockEvents);
    });
  });

  describe('getActiveEvents', () => {
    it('should return active events', async () => {
      const mockEvents = [{ id: 1 }] as any[];
      mockEventsRepository.find.mockResolvedValue(mockEvents);
      expect(await service.getActiveEvents()).toEqual(mockEvents);
    });
  });

  describe('checkAndUpdatePeak', () => {
    it('should throw ResourceNotFoundException if event not found', async () => {
      mockEventsRepository.findOne.mockResolvedValue(null);
      await expect(service.checkAndUpdatePeak(99, 5)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });

    it('should update peak if current members exceeds previous peak', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        peakConcurrentMembers: 3,
      });
      mockEventsRepository.update.mockResolvedValue({ affected: 1 });
      await service.checkAndUpdatePeak(1, 10);
      expect(mockEventsRepository.update).toHaveBeenCalledWith(1, {
        peakConcurrentMembers: 10,
      });
    });

    it('should NOT update peak if current members does not exceed previous peak', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        peakConcurrentMembers: 10,
      });
      await service.checkAndUpdatePeak(1, 3);
      expect(mockEventsRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelEvent', () => {
    it('should throw ForbiddenException if user is not the owner', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });
      await expect(service.cancelEvent(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if event is started', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.STARTED,
        members: [],
        media: [],
      });
      await expect(service.cancelEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete the event if user is owner and event is WAITING', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        members: [],
        media: [],
      });
      mockEventsRepository.delete.mockResolvedValue({ affected: 1 });
      await service.cancelEvent(1, 1);
      expect(mockEventsRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('leaveEvent', () => {
    it('should throw BadRequestException if user is the owner', async () => {
      mockMembersService.getByUserIdAndEventId.mockResolvedValue({
        id: 1,
        role: MemberRole.OWNER,
      });
      await expect(service.leaveEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete member if not owner', async () => {
      mockMembersService.getByUserIdAndEventId.mockResolvedValue({
        id: 5,
        role: MemberRole.MEMBER,
      });
      mockMembersService.delete.mockResolvedValue(undefined);
      await service.leaveEvent(1, 1);
      expect(mockMembersService.delete).toHaveBeenCalledWith(5);
    });
  });

  describe('joinEvent', () => {
    it('should throw BadRequestException if already a member', async () => {
      mockMembersService.findByUserIdAndEventId.mockResolvedValue({ id: 1 });
      await expect(service.joinEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if event is finished', async () => {
      mockMembersService.findByUserIdAndEventId.mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue({ id: 1 });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.FINISHED,
        members: [{ user: { id: 99 }, role: MemberRole.OWNER }],
        media: [],
      });
      await expect(service.joinEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if event is at max capacity', async () => {
      mockMembersService.findByUserIdAndEventId.mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue({ id: 1 });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        maxMembers: 2,
        members: [{ user: { id: 99 }, role: MemberRole.OWNER }],
        visibility: EventVisibility.PUBLIC,
        media: [],
      });
      mockMembersService.countFromEvent.mockResolvedValue(2);
      await expect(service.joinEvent(1, 1)).rejects.toThrow(ForbiddenException);
    });

    it('should create and save member if all checks pass for a public event', async () => {
      const mockUser = { id: 1 };
      const mockEvent = {
        id: 1,
        status: EventStatus.WAITING,
        maxMembers: 10,
        members: [{ user: { id: 99 }, role: MemberRole.OWNER }],
        visibility: EventVisibility.PUBLIC,
        media: [],
      };
      const mockMember = { id: 5, role: MemberRole.MEMBER };

      mockMembersService.findByUserIdAndEventId.mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockEventsRepository.findOne.mockResolvedValue(mockEvent);
      mockMembersService.countFromEvent.mockResolvedValue(1);
      mockMembersService.create.mockReturnValue(mockMember);
      mockMembersService.save.mockResolvedValue(mockMember);

      await service.joinEvent(1, 1);
      expect(mockMembersService.save).toHaveBeenCalledWith(mockMember);
    });
  });

  describe('startEvent', () => {
    it('should throw ForbiddenException if user is not the owner', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });
      await expect(service.startEvent(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if event is not WAITING', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.STARTED,
        media: [{}],
        eventDate: new Date(Date.now() - 1000),
        members: [],
        visibility: EventVisibility.PUBLIC,
      });
      await expect(service.startEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if event has no media', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        media: [],
        eventDate: new Date(Date.now() - 1000),
        members: [],
        visibility: EventVisibility.PUBLIC,
      });
      await expect(service.startEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if event date is in the future', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        media: [{}],
        eventDate: new Date(Date.now() + 9999999),
        members: [],
        visibility: EventVisibility.PUBLIC,
      });
      await expect(service.startEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should change status to STARTED if all checks pass', async () => {
      const mockEvent = {
        id: 1,
        status: EventStatus.WAITING,
        media: [{}],
        eventDate: new Date(Date.now() - 1000),
        members: [],
        visibility: EventVisibility.PUBLIC,
      };
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue(mockEvent);
      mockEventsRepository.save.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.STARTED,
      });

      const result = await service.startEvent(1, 1);
      expect(result).toBe(EventStatus.STARTED);
    });
  });

  describe('finishEvent', () => {
    it('should throw ForbiddenException if user is not the owner', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });
      await expect(service.finishEvent(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if event is not STARTED', async () => {
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        media: [],
        members: [],
      });
      await expect(service.finishEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should finish event and update media statuses', async () => {
      const mockEvent = {
        id: 1,
        status: EventStatus.STARTED,
        media: [
          { id: 1, status: EventMediaStatus.CURRENT },
          { id: 2, status: EventMediaStatus.PENDING },
        ],
        members: [],
      };
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockEventsRepository.findOne.mockResolvedValue(mockEvent);
      mockEventMediaService.saveMany.mockResolvedValue([]);
      mockEventsRepository.save.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.FINISHED,
      });

      const result = await service.finishEvent(1, 1);

      expect(mockEventMediaService.saveMany).toHaveBeenCalled();
      expect(result).toBe(EventStatus.FINISHED);
    });
  });

  describe('getEventStatus', () => {
    it('should throw ForbiddenException if user is not a member', async () => {
      mockMembersService.findByUserIdAndEventId.mockResolvedValue(null);
      await expect(service.getEventStatus(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return event status if user is a member', async () => {
      mockMembersService.findByUserIdAndEventId.mockResolvedValue({ id: 1 });
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.STARTED,
        members: [],
        media: [],
      });
      const result = await service.getEventStatus(1, 1);
      expect(result).toBe(EventStatus.STARTED);
    });
  });

  describe('checkCanSeeEvent', () => {
    it('should return true if user is the owner', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        visibility: EventVisibility.PUBLIC,
        members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
        media: [],
      });
      expect(await service.checkCanSeeEvent(1, 1)).toBe(true);
    });

    it('should return true for PUBLIC events', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        visibility: EventVisibility.PUBLIC,
        members: [{ user: { id: 99 }, role: MemberRole.OWNER }],
        media: [],
      });
      expect(await service.checkCanSeeEvent(1, 1)).toBe(true);
    });

    it('should return true for REQUEST_ONLY events', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        visibility: EventVisibility.REQUEST_ONLY,
        members: [{ user: { id: 99 }, role: MemberRole.OWNER }],
        media: [],
      });
      expect(await service.checkCanSeeEvent(1, 1)).toBe(true);
    });

    it('should delegate to requestsService for FRIENDS_ONLY events', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        visibility: EventVisibility.FRIENDS_ONLY,
        members: [{ user: { id: 99 }, role: MemberRole.OWNER }],
        media: [],
      });
      mockRequestsService.isFriendsWithUser.mockResolvedValue(true);
      expect(await service.checkCanSeeEvent(1, 1)).toBe(true);
      expect(mockRequestsService.isFriendsWithUser).toHaveBeenCalledWith(1, 99);
    });

    it('should throw ResourceNotFoundException if event has no owner', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        visibility: EventVisibility.PUBLIC,
        members: [],
        media: [],
      });
      await expect(service.checkCanSeeEvent(1, 1)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('addMediaToStandardEvent', () => {
    const mockOwner = { user: { id: 1 } };
    const baseEvent = {
      id: 1,
      status: EventStatus.WAITING,
      media: [],
      members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
    };

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue(baseEvent);
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });
      await expect(service.addMediaToStandardEvent(1, 1, 100)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if event is not WAITING', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        ...baseEvent,
        status: EventStatus.STARTED,
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue(mockOwner);
      await expect(service.addMediaToStandardEvent(1, 1, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if media is already in the lineup', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        ...baseEvent,
        media: [{ media: { tmdbId: 100 } }],
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue(mockOwner);
      await expect(service.addMediaToStandardEvent(1, 1, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if event already has 20 media items', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        ...baseEvent,
        media: Array(20).fill({ media: { tmdbId: 999 } }),
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue(mockOwner);
      await expect(service.addMediaToStandardEvent(1, 1, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should add media and save the event if all checks pass', async () => {
      const mockMedia = { id: 1, tmdbId: 100 };
      const mockEventMedia = { id: 1, media: mockMedia };
      const updatedEvent = { ...baseEvent, media: [mockEventMedia] };

      mockStandardEventsRepository.findOne.mockResolvedValue(baseEvent);
      mockMembersService.getOwnerFromEvent.mockResolvedValue(mockOwner);
      mockMediaService.findByTmdbId.mockResolvedValue(mockMedia);
      mockEventMediaService.create.mockResolvedValue(mockEventMedia);
      mockStandardEventsRepository.save.mockResolvedValue(updatedEvent);

      const result = await service.addMediaToStandardEvent(1, 1, 100);
      expect(mockStandardEventsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedEvent);
    });
  });

  describe('addProposedMediaToVotingEvent', () => {
    it('should throw BadRequestException if event is not in VOTING status', async () => {
      mockVotingEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        proposedMedia: [],
        media: [],
        members: [],
      });
      await expect(
        service.addProposedMediaToVotingEvent(1, 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if media is already proposed', async () => {
      mockVotingEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.VOTING,
        proposedMedia: [{ tmdbId: 100 }],
        media: [],
        members: [],
      });
      await expect(
        service.addProposedMediaToVotingEvent(1, 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if proposed media limit (50) is reached', async () => {
      mockVotingEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.VOTING,
        proposedMedia: Array(50).fill({ tmdbId: 999 }),
        media: [],
        members: [],
      });
      await expect(
        service.addProposedMediaToVotingEvent(1, 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should add proposed media and save the event', async () => {
      const mockMedia = { tmdbId: 100 };
      const mockEvent = {
        id: 1,
        status: EventStatus.VOTING,
        proposedMedia: [],
        media: [],
        members: [],
      };
      const saved = { ...mockEvent, proposedMedia: [mockMedia] };

      mockVotingEventsRepository.findOne.mockResolvedValue(mockEvent);
      mockMediaService.findByTmdbId.mockResolvedValue(mockMedia);
      mockVotingEventsRepository.save.mockResolvedValue(saved);

      const result = await service.addProposedMediaToVotingEvent(1, 100);
      expect(mockVotingEventsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(saved);
    });
  });

  describe('updateStandardEvent', () => {
    const baseEvent = {
      id: 1,
      status: EventStatus.WAITING,
      members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
      createdAt: new Date(Date.now() - 9999999),
      media: [],
    };

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue(baseEvent);
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });
      await expect(
        service.updateStandardEvent(1, 1, {
          name: 'New',
          updateAll: false,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if event is not WAITING', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        ...baseEvent,
        status: EventStatus.STARTED,
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      await expect(
        service.updateStandardEvent(1, 1, {
          name: 'New',
          updateAll: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if maxMembers is less than current member count', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        ...baseEvent,
        members: [{}, {}, {}],
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      await expect(
        service.updateStandardEvent(1, 1, {
          maxMembers: 1,
          updateAll: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if eventDate is too soon after creation', async () => {
      const recentEvent = { ...baseEvent, createdAt: new Date() };
      mockStandardEventsRepository.findOne.mockResolvedValue(recentEvent);
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      await expect(
        service.updateStandardEvent(1, 1, {
          eventDate: new Date(Date.now() + 1000),
          updateAll: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should merge and save the updated event', async () => {
      const updatedEvent = { ...baseEvent, name: 'Updated' };
      mockStandardEventsRepository.findOne.mockResolvedValue(baseEvent);
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockStandardEventsRepository.merge.mockReturnValue(updatedEvent);
      mockStandardEventsRepository.save.mockResolvedValue(updatedEvent);

      const result = await service.updateStandardEvent(1, 1, {
        name: 'Updated',
        updateAll: false,
      });
      expect(mockStandardEventsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedEvent);
    });
  });

  describe('updateVotingEvent', () => {
    const baseEvent = {
      id: 1,
      status: EventStatus.VOTING,
      members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
      createdAt: new Date(Date.now() - 9999999),
      proposedMedia: [],
      media: [],
    };

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockVotingEventsRepository.findOne.mockResolvedValue(baseEvent);
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });
      await expect(
        service.updateVotingEvent(1, 1, {
          name: 'New',
          votingEndDate: new Date(Date.now() + 9999999),
          updateAll: false,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if event is STARTED or FINISHED', async () => {
      mockVotingEventsRepository.findOne.mockResolvedValue({
        ...baseEvent,
        status: EventStatus.STARTED,
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      await expect(
        service.updateVotingEvent(1, 1, {
          name: 'New',
          votingEndDate: new Date(Date.now() + 9999999),
          updateAll: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if votingEndDate is too soon', async () => {
      mockVotingEventsRepository.findOne.mockResolvedValue({
        ...baseEvent,
        createdAt: new Date(),
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      await expect(
        service.updateVotingEvent(1, 1, {
          votingEndDate: new Date(Date.now() + 1000),
          updateAll: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should merge and save the updated voting event', async () => {
      const updatedEvent = { ...baseEvent, name: 'Updated' };
      mockVotingEventsRepository.findOne.mockResolvedValue(baseEvent);
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockVotingEventsRepository.merge.mockReturnValue(updatedEvent);
      mockVotingEventsRepository.save.mockResolvedValue(updatedEvent);

      const result = await service.updateVotingEvent(1, 1, {
        name: 'Updated',
        votingEndDate: new Date(Date.now() + 9999999),
        updateAll: false,
      });
      expect(mockVotingEventsRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedEvent);
    });
  });

  describe('inviteUserToEvent', () => {
    const dto = { receiverId: 2, eventId: 1 };

    it('should throw BadRequestException if event is finished', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.FINISHED,
        maxMembers: 10,
        members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
        media: [],
      });
      await expect(service.inviteUserToEvent(1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if event is at max capacity', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        maxMembers: 2,
        members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
        media: [],
      });
      mockMembersService.countFromEvent.mockResolvedValue(2);
      await expect(service.inviteUserToEvent(1, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if receiver is already a member', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        maxMembers: 10,
        members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
        media: [],
      });
      mockMembersService.countFromEvent.mockResolvedValue(1);
      mockMembersService.getByUserIdAndEventId.mockResolvedValue({ id: 1 });
      mockMembersService.findByUserIdAndEventId.mockResolvedValue({ id: 2 });
      await expect(service.inviteUserToEvent(1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call requestsService.createEventInviteRequest when all checks pass', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        maxMembers: 10,
        members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
        media: [],
      });
      mockMembersService.countFromEvent.mockResolvedValue(1);
      mockMembersService.getByUserIdAndEventId.mockResolvedValue({ id: 1 });
      mockMembersService.findByUserIdAndEventId.mockResolvedValue(null);
      mockRequestsService.createEventInviteRequest.mockResolvedValue(undefined);

      await service.inviteUserToEvent(1, dto);
      expect(mockRequestsService.createEventInviteRequest).toHaveBeenCalledWith(
        1,
        dto,
      );
    });
  });

  describe('requestAccessToEvent', () => {
    it('should throw BadRequestException if event is finished', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.FINISHED,
        maxMembers: 10,
        members: [],
        media: [],
      });
      await expect(service.requestAccessToEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user is already a member', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        maxMembers: 10,
        members: [],
        media: [],
      });
      mockMembersService.countFromEvent.mockResolvedValue(1);
      mockMembersService.findByUserIdAndEventId.mockResolvedValue({ id: 1 });
      await expect(service.requestAccessToEvent(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create access request if all checks pass', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        maxMembers: 10,
        members: [],
        media: [],
      });
      mockMembersService.countFromEvent.mockResolvedValue(1);
      mockMembersService.findByUserIdAndEventId.mockResolvedValue(null);
      mockRequestsService.createEventAccessRequest.mockResolvedValue(undefined);

      await service.requestAccessToEvent(1, 1);
      expect(mockRequestsService.createEventAccessRequest).toHaveBeenCalledWith(
        1,
        1,
      );
    });
  });

  describe('getActiveAccessRequestsFromEvent', () => {
    it('should throw ForbiddenException if user is not the owner', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        members: [{ user: { id: 99 }, role: MemberRole.OWNER }],
        media: [],
      });
      await expect(
        service.getActiveAccessRequestsFromEvent(1, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return requests if user is the owner', async () => {
      const mockRequests = { data: [], total: 0, page: 1, lastPage: 1 };
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        members: [{ user: { id: 1 }, role: MemberRole.OWNER }],
        media: [],
      });
      mockRequestsService.findActiveEventAccessRequestsFromEvent.mockResolvedValue(
        mockRequests,
      );

      const result = await service.getActiveAccessRequestsFromEvent(1, 1);
      expect(result).toEqual(mockRequests);
    });
  });

  describe('resolveEventInviteRequest', () => {
    it('should throw ForbiddenException if user is not the receiver', async () => {
      mockRequestsService.findEventInviteRequestById.mockResolvedValue({
        id: 1,
        receiver: { id: 99 },
        event: { id: 1 },
      });
      await expect(
        service.resolveEventInviteRequest(1, 1, true),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject the request if accept is false', async () => {
      const mockRequest = {
        id: 1,
        receiver: { id: 1 },
        event: { id: 1 },
        accepted: false,
      };
      mockRequestsService.findEventInviteRequestById.mockResolvedValue(
        mockRequest,
      );
      mockRequestsService.resolveRequest.mockResolvedValue(false);

      const result = await service.resolveEventInviteRequest(1, 1, false);
      expect(mockRequestsService.resolveRequest).toHaveBeenCalledWith(
        mockRequest,
        false,
      );
      expect(result).toBe(false);
    });
  });

  describe('resolveEventAccessRequest', () => {
    it('should throw ForbiddenException if user is not the event owner', async () => {
      mockRequestsService.findEventAccessRequestById.mockResolvedValue({
        id: 1,
        sender: { id: 2 },
        event: { id: 1 },
        accepted: false,
      });
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 99 },
      });

      await expect(
        service.resolveEventAccessRequest(1, 1, true),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should resolve and return false if rejected', async () => {
      const mockRequest = {
        id: 1,
        sender: { id: 2 },
        event: { id: 1 },
        accepted: false,
      };
      mockRequestsService.findEventAccessRequestById.mockResolvedValue(
        mockRequest,
      );
      mockMembersService.getOwnerFromEvent.mockResolvedValue({
        user: { id: 1 },
      });
      mockRequestsService.resolveRequest.mockResolvedValue(false);

      const result = await service.resolveEventAccessRequest(1, 1, false);
      expect(result).toBe(false);
    });
  });

  describe('getEventDetailedInformation', () => {
    it('should return EventDetailedInfoDto for STANDARD type', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 1,
        type: EventType.STANDARD,
        name: 'Test',
        description: 'Desc',
        eventDate: new Date(),
        visibility: EventVisibility.PUBLIC,
        status: EventStatus.WAITING,
        maxMembers: 10,
        recurringGroupId: null,
        members: [],
        media: [],
      });
      const result = await service.getEventDetailedInformation(1);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('type', EventType.STANDARD);
    });

    it('should return VotingEventDetailedInfoDto for VOTING type', async () => {
      mockEventsRepository.findOne.mockResolvedValue({
        id: 2,
        type: EventType.VOTING,
        name: 'Voting',
        description: 'Vote',
        eventDate: new Date(),
        visibility: EventVisibility.PUBLIC,
        status: EventStatus.VOTING,
        maxMembers: 10,
        recurringGroupId: null,
        maxMedia: 5,
        maxVotesPerMember: 3,
        votingEndDate: new Date(),
        members: [],
        media: [],
      });
      const result = await service.getEventDetailedInformation(2);
      expect(result).toHaveProperty('id', 2);
      expect(result).toHaveProperty('maxMedia', 5);
    });
  });

  describe('changeEventStatus', () => {
    it('should set startDate when changing to STARTED', async () => {
      const mockEvent = {
        id: 1,
        status: EventStatus.WAITING,
        members: [],
        media: [],
      } as any;
      mockEventsRepository.findOne.mockResolvedValue(mockEvent);
      mockEventsRepository.save.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.STARTED,
      });

      const result = await service.changeEventStatus(1, EventStatus.STARTED);
      expect(mockEvent.startDate).toBeDefined();
      expect(result).toBe(EventStatus.STARTED);
    });

    it('should set endDate when changing to FINISHED', async () => {
      const mockEvent = {
        id: 1,
        status: EventStatus.STARTED,
        members: [],
        media: [],
      } as any;
      mockEventsRepository.findOne.mockResolvedValue(mockEvent);
      mockEventsRepository.save.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.FINISHED,
      });

      const result = await service.changeEventStatus(1, EventStatus.FINISHED);
      expect(mockEvent.endDate).toBeDefined();
      expect(result).toBe(EventStatus.FINISHED);
    });
  });

  describe('updateTimer', () => {
    it('should call eventsRepository.update with the correct timer value', async () => {
      mockEventsRepository.update.mockResolvedValue({ affected: 1 });
      await service.updateTimer(1, 120);
      expect(mockEventsRepository.update).toHaveBeenCalledWith(1, {
        timer: 120,
      });
    });
  });

  describe('deleteMediaFromStandardEvent', () => {
    it('should throw BadRequestException if event is not WAITING', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.STARTED,
        media: [{ media: { tmdbId: 1 } }],
        members: [],
      });
      await expect(
        service.deleteMediaFromStandardEvent(1, 1, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event has only one media item', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        media: [{ media: { tmdbId: 100 } }],
        members: [],
      });
      await expect(
        service.deleteMediaFromStandardEvent(1, 1, 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if media is not found in event', async () => {
      mockStandardEventsRepository.findOne.mockResolvedValue({
        id: 1,
        status: EventStatus.WAITING,
        media: [{ media: { tmdbId: 100 } }, { media: { tmdbId: 200 } }],
        members: [],
      });
      await expect(
        service.deleteMediaFromStandardEvent(1, 1, 999),
      ).rejects.toThrow(BadRequestException);
    });

    it('should remove media and save event if all checks pass', async () => {
      const mockEvent = {
        id: 1,
        status: EventStatus.WAITING,
        media: [{ media: { tmdbId: 100 } }, { media: { tmdbId: 200 } }],
        members: [],
      };
      mockStandardEventsRepository.findOne.mockResolvedValue(mockEvent);
      mockStandardEventsRepository.save.mockResolvedValue({
        ...mockEvent,
        media: [{ media: { tmdbId: 200 } }],
      });

      await service.deleteMediaFromStandardEvent(1, 1, 100);
      expect(mockStandardEventsRepository.save).toHaveBeenCalled();
    });
  });
});
