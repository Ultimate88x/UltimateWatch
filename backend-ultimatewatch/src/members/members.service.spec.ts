/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { MemberRole } from 'src/common/enums/member.role.enum';
import { EventStatus } from 'src/common/enums/event.status.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('MembersService', () => {
  let service: MembersService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockMembersRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: getRepositoryToken(Member),
          useValue: mockMembersRepository,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a member with MEMBER role', () => {
      const mockUser = { id: 1, username: 'testuser' } as any;
      const mockEvent = { id: 1 } as any;
      const mockMember = {
        id: 1,
        role: MemberRole.MEMBER,
        user: mockUser,
        event: mockEvent,
      };

      mockMembersRepository.create.mockReturnValue(mockMember);

      const result = service.create(mockUser, mockEvent);

      expect(mockMembersRepository.create).toHaveBeenCalledWith({
        role: MemberRole.MEMBER,
        user: mockUser,
        event: mockEvent,
      });
      expect(result).toEqual(mockMember);
    });
  });

  describe('save', () => {
    it('should save and return the member', async () => {
      const mockMember = { id: 1, role: MemberRole.MEMBER } as Member;
      mockMembersRepository.save.mockResolvedValue(mockMember);

      const result = await service.save(mockMember);
      expect(mockMembersRepository.save).toHaveBeenCalledWith(mockMember);
      expect(result).toEqual(mockMember);
    });
  });

  describe('delete', () => {
    it('should call repository.delete with the given id', async () => {
      mockMembersRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(5);
      expect(mockMembersRepository.delete).toHaveBeenCalledWith(5);
    });
  });

  describe('findById', () => {
    it('should return a member if found', async () => {
      const mockMember = { id: 1, role: MemberRole.MEMBER } as Member;
      mockMembersRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.findById(1);
      expect(result).toEqual(mockMember);
    });

    it('should return null if not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(99);
      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return a member if found', async () => {
      const mockMember = { id: 1, role: MemberRole.MEMBER } as Member;
      mockMembersRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.getById(1);
      expect(result).toEqual(mockMember);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);
      await expect(service.getById(99)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findByUserIdAndEventId', () => {
    it('should return a member if found', async () => {
      const mockMember = { id: 1, user: { id: 1 }, event: { id: 10 } } as any;
      mockMembersRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.findByUserIdAndEventId(1, 10);
      expect(result).toEqual(mockMember);
    });

    it('should return null if not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUserIdAndEventId(1, 10);
      expect(result).toBeNull();
    });
  });

  describe('getByUserIdAndEventId', () => {
    it('should return a member if found', async () => {
      const mockMember = { id: 1, user: { id: 1 }, event: { id: 10 } } as any;
      mockMembersRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.getByUserIdAndEventId(1, 10);
      expect(result).toEqual(mockMember);
    });

    it('should throw ResourceNotFoundException if not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);
      await expect(service.getByUserIdAndEventId(1, 10)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('findOwnerFromEvent', () => {
    it('should return the owner if found', async () => {
      const mockOwner = {
        id: 1,
        role: MemberRole.OWNER,
        user: { id: 5 },
      } as any;
      mockMembersRepository.findOne.mockResolvedValue(mockOwner);

      const result = await service.findOwnerFromEvent(10);
      expect(result).toEqual(mockOwner);
    });

    it('should return null if no owner found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);

      const result = await service.findOwnerFromEvent(10);
      expect(result).toBeNull();
    });
  });

  describe('getOwnerFromEvent', () => {
    it('should return the owner member', async () => {
      const mockOwner = {
        id: 1,
        role: MemberRole.OWNER,
        user: { id: 5 },
      } as Member;
      mockMembersRepository.findOne.mockResolvedValue(mockOwner);

      const result = await service.getOwnerFromEvent(10);
      expect(result).toEqual(mockOwner);
    });

    it('should throw ResourceNotFoundException if owner not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);
      await expect(service.getOwnerFromEvent(10)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('countFromEvent', () => {
    it('should return count of members in event', async () => {
      mockMembersRepository.count.mockResolvedValue(4);
      const result = await service.countFromEvent(1);
      expect(result).toBe(4);
    });
  });

  describe('countTotalUniqueFromEvent', () => {
    it('should return the count of unique members who have joined', async () => {
      mockMembersRepository.count.mockResolvedValue(3);

      const result = await service.countTotalUniqueFromEvent(1);

      expect(mockMembersRepository.count).toHaveBeenCalledWith({
        where: { event: { id: 1 }, hasJoined: true },
      });
      expect(result).toBe(3);
    });
  });

  describe('markAsJoined', () => {
    it('should update hasJoined to true for the given memberId', async () => {
      mockMembersRepository.update.mockResolvedValue({ affected: 1 });

      await service.markAsJoined(5);

      expect(mockMembersRepository.update).toHaveBeenCalledWith(
        { id: 5, hasJoined: false },
        { hasJoined: true },
      );
    });
  });

  describe('retrieveByUserIdAndEventId', () => {
    it('should return a MemberDetailDto if member is found', async () => {
      const mockMember = {
        id: 1,
        role: MemberRole.MEMBER,
        user: { id: 1, username: 'testuser', imagePath: 'http://img.com' },
        event: { id: 10 },
      } as any;
      mockMembersRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.retrieveByUserIdAndEventId(1, 10);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('testuser');
      expect(result?.isCurrentUser).toBe(true);
    });

    it('should return null if member is not found', async () => {
      mockMembersRepository.findOne.mockResolvedValue(null);

      const result = await service.retrieveByUserIdAndEventId(1, 10);
      expect(result).toBeNull();
    });
  });

  describe('getFromEvent', () => {
    it('should return paginated member list for an event', async () => {
      const mockMembers = [
        {
          id: 1,
          role: MemberRole.OWNER,
          user: { id: 1, username: 'owner', imagePath: 'http://img.com' },
        },
        {
          id: 2,
          role: MemberRole.MEMBER,
          user: { id: 2, username: 'member', imagePath: 'http://img2.com' },
        },
      ] as any[];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockMembers, 2]);

      const result = await service.getFromEvent(1, 1, 10, 1);

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('owner');
      expect(result.data[0].isCurrentUser).toBe(true);
      expect(result.data[1].isCurrentUser).toBe(false);
    });

    it('should compute lastPage correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 25]);

      const result = await service.getFromEvent(1, 1, 10, 1);

      expect(result.lastPage).toBe(3);
    });
  });

  describe('updateMemberRole', () => {
    it('should throw ForbiddenException if requester is not the owner', async () => {
      const mockMember = {
        id: 2,
        role: MemberRole.MEMBER,
        user: { id: 2 },
      } as any;
      const mockOwner = {
        id: 1,
        role: MemberRole.OWNER,
        user: { id: 99 },
      } as any;

      mockMembersRepository.findOne
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(mockOwner);

      await expect(
        service.updateMemberRole(1, {
          targetUserId: 2,
          eventId: 10,
          role: MemberRole.MODERATOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update the member role', async () => {
      const mockMember = {
        id: 2,
        role: MemberRole.MEMBER,
        user: { id: 2 },
      } as any;
      const mockOwner = {
        id: 1,
        role: MemberRole.OWNER,
        user: { id: 1 },
      } as any;

      mockMembersRepository.findOne
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(mockOwner);
      mockMembersRepository.save.mockResolvedValue(mockMember);

      await service.updateMemberRole(1, {
        targetUserId: 2,
        eventId: 10,
        role: MemberRole.MODERATOR,
      });

      expect(mockMember.role).toBe(MemberRole.MODERATOR);
      expect(mockMembersRepository.save).toHaveBeenCalledWith(mockMember);
    });

    it('should demote current owner to MODERATOR when granting OWNER role', async () => {
      const mockMember = {
        id: 2,
        role: MemberRole.MEMBER,
        user: { id: 2 },
      } as any;
      const mockOwner = {
        id: 1,
        role: MemberRole.OWNER,
        user: { id: 1 },
      } as any;

      mockMembersRepository.findOne
        .mockResolvedValueOnce(mockMember)
        .mockResolvedValueOnce(mockOwner);
      mockMembersRepository.save.mockResolvedValue(mockMember);

      await service.updateMemberRole(1, {
        targetUserId: 2,
        eventId: 10,
        role: MemberRole.OWNER,
      });

      expect(mockOwner.role).toBe(MemberRole.MODERATOR);
      expect(mockMembersRepository.save).toHaveBeenCalledWith(mockOwner);
      expect(mockMembersRepository.save).toHaveBeenCalledWith(mockMember);
    });
  });

  describe('kickMemberFromEvent', () => {
    it('should throw ForbiddenException if requester is a plain MEMBER', async () => {
      const requesterMember = {
        id: 1,
        role: MemberRole.MEMBER,
        user: { id: 1 },
      } as any;

      mockMembersRepository.findOne.mockResolvedValueOnce(requesterMember);

      await expect(
        service.kickMemberFromEvent(1, { kickedUserId: 2, eventId: 10 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if the event is finished', async () => {
      const requesterMember = {
        id: 1,
        role: MemberRole.OWNER,
        user: { id: 1 },
      } as any;
      const targetMember = {
        id: 2,
        role: MemberRole.MEMBER,
        user: { id: 2 },
        event: { id: 10, status: EventStatus.FINISHED },
      } as any;

      mockMembersRepository.findOne
        .mockResolvedValueOnce(requesterMember)
        .mockResolvedValueOnce(targetMember);

      await expect(
        service.kickMemberFromEvent(1, { kickedUserId: 2, eventId: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should delete the member if checks pass', async () => {
      const requesterMember = {
        id: 1,
        role: MemberRole.OWNER,
        user: { id: 1 },
      } as any;
      const targetMember = {
        id: 2,
        role: MemberRole.MEMBER,
        user: { id: 2 },
        event: { id: 10, status: EventStatus.WAITING },
      } as any;

      mockMembersRepository.findOne
        .mockResolvedValueOnce(requesterMember)
        .mockResolvedValueOnce(targetMember);
      mockMembersRepository.delete.mockResolvedValue({ affected: 1 });

      await service.kickMemberFromEvent(1, { kickedUserId: 2, eventId: 10 });

      expect(mockMembersRepository.delete).toHaveBeenCalledWith(2);
    });
  });
});
