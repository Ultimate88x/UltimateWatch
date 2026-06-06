/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { KickMemberDto } from './dto/kick-member-dto';
import { UpdateMemberRoleDto } from './dto/update-member-role-dto';
import { MemberListResponseDto } from './dto/member-list-response-dto';
import { MemberDetailDto } from './dto/member-detail-dto';
import { MemberRole } from 'src/common/enums/member.role.enum'; // Asegúrate de ajustar la ruta si usas un enum

describe('MembersController', () => {
  let controller: MembersController;
  let service: MembersService;
  let eventEmitter: EventEmitter2;

  const mockMembersService = {
    getFromEvent: jest.fn(),
    retrieveByUserIdAndEventId: jest.fn(),
    kickMemberFromEvent: jest.fn(),
    updateMemberRole: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<MembersController>(MembersController);
    service = module.get<MembersService>(MembersService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findFromEvent', () => {
    it('should call membersService.getFromEvent with correct parameters', async () => {
      const userId = 1;
      const eventIdParam = '10';
      const numericEventId = 10;
      const page = 1;
      const limit = 10;

      const expectedResponse = {
        data: [],
        total: 0,
        page: 1,
        lastPage: 1,
      } as MemberListResponseDto;

      mockMembersService.getFromEvent.mockResolvedValue(expectedResponse);

      const result = await controller.findFromEvent(
        userId,
        eventIdParam,
        page,
        limit,
      );

      expect(service.getFromEvent).toHaveBeenCalledWith(
        numericEventId,
        page,
        limit,
        userId,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('retrieveMember', () => {
    it('should call membersService.retrieveByUserIdAndEventId with numeric eventId', async () => {
      const userId = 1;
      const eventIdParam = '10';
      const numericEventId = 10;

      const expectedResponse = {
        id: 1,
        role: 'ADMIN',
      } as unknown as MemberDetailDto;

      mockMembersService.retrieveByUserIdAndEventId.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.retrieveMember(userId, eventIdParam);

      expect(service.retrieveByUserIdAndEventId).toHaveBeenCalledWith(
        userId,
        numericEventId,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should return null if member is not found', async () => {
      const userId = 1;
      const eventIdParam = '10';

      mockMembersService.retrieveByUserIdAndEventId.mockResolvedValue(null);

      const result = await controller.retrieveMember(userId, eventIdParam);

      expect(result).toBeNull();
    });
  });

  describe('kickMember', () => {
    it('should call kickMemberFromEvent, emit event, and return success message', async () => {
      const userId = 1;
      const kickMemberDto: KickMemberDto = {
        kickedUserId: 5,
        eventId: 10,
      };

      mockMembersService.kickMemberFromEvent.mockResolvedValue(undefined);

      const result = await controller.kickMember(userId, kickMemberDto);

      expect(service.kickMemberFromEvent).toHaveBeenCalledWith(
        userId,
        kickMemberDto,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('member.kicked', {
        kickMemberDto,
      });
      expect(result).toEqual({ message: 'Member kicked successfully' });
    });
  });

  describe('updateMemberRole', () => {
    it('should call updateMemberRole, emit event, and return success message', async () => {
      const userId = 1;
      const updateMemberRoleDto: UpdateMemberRoleDto = {
        targetUserId: 5,
        eventId: 10,
        role: MemberRole.OWNER,
      };

      mockMembersService.updateMemberRole.mockResolvedValue(undefined);

      const result = await controller.updateMemberRole(
        userId,
        updateMemberRoleDto,
      );

      expect(service.updateMemberRole).toHaveBeenCalledWith(
        userId,
        updateMemberRoleDto,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('member.role-updated', {
        updateMemberRoleDto,
      });
      expect(result).toEqual({ message: 'Member role changed successfully' });
    });
  });
});
