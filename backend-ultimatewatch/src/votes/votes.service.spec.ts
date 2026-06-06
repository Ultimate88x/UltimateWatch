/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { VotesService } from './votes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { MembersService } from 'src/members/members.service';
import { MediaService } from 'src/media/media.service';
import { EventsService } from 'src/events/events.service';
import { BadRequestException } from '@nestjs/common';

describe('VotesService', () => {
  let service: VotesService;

  const mockVotesRepository = {
    save: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  const mockMembersService = {
    getByUserIdAndEventId: jest.fn(),
  };

  const mockMediaService = {
    findByTmdbId: jest.fn(),
  };

  const mockEventsService = {
    findVotingEventBydId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotesService,
        { provide: getRepositoryToken(Vote), useValue: mockVotesRepository },
        { provide: MembersService, useValue: mockMembersService },
        { provide: MediaService, useValue: mockMediaService },
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    service = module.get<VotesService>(VotesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVote', () => {
    const mockMember = { id: 1, votes: [], user: { id: 1 } } as any;
    const mockEvent = {
      id: 10,
      votingEndDate: new Date(Date.now() + 100000),
      maxVotesPerMember: 3,
      proposedMedia: [{ tmdbId: 200 }],
    } as any;
    const mockMedia = { id: 1, tmdbId: 200 } as any;
    const dto = { eventId: 10, mediaId: 200 };

    it('should create a vote successfully', async () => {
      mockMembersService.getByUserIdAndEventId.mockResolvedValue(mockMember);
      mockEventsService.findVotingEventBydId.mockResolvedValue(mockEvent);
      mockMediaService.findByTmdbId.mockResolvedValue(mockMedia);
      mockVotesRepository.create.mockReturnValue({
        member: mockMember,
        media: mockMedia,
      });
      mockVotesRepository.save.mockResolvedValue({});

      await expect(service.createVote(dto, 1)).resolves.not.toThrow();
      expect(mockVotesRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if voting period has ended', async () => {
      const expiredEvent = {
        ...mockEvent,
        votingEndDate: new Date(Date.now() - 1000),
      };
      mockMembersService.getByUserIdAndEventId.mockResolvedValue(mockMember);
      mockEventsService.findVotingEventBydId.mockResolvedValue(expiredEvent);

      await expect(service.createVote(dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if max votes reached', async () => {
      const fullMember = { ...mockMember, votes: [{}, {}, {}] };
      mockMembersService.getByUserIdAndEventId.mockResolvedValue(fullMember);
      mockEventsService.findVotingEventBydId.mockResolvedValue(mockEvent);

      await expect(service.createVote(dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('countFromUser', () => {
    it('should return vote count for a user', async () => {
      mockVotesRepository.count.mockResolvedValue(7);
      const result = await service.countFromUser(1);
      expect(result).toBe(7);
    });
  });
});
