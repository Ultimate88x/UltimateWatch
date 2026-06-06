import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { MembersService } from 'src/members/members.service';
import { CreateCommentDto } from './dto/create-comment-dto';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockCommentRepository = {
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  const mockMembersService = {
    getByUserIdAndEventId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        { provide: MembersService, useValue: mockMembersService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a comment', async () => {
      const mockMember = { id: 1 };
      const dto: CreateCommentDto = { eventId: 10, message: 'Hello' };
      const mockComment = { id: 1, message: 'Hello', member: mockMember };

      mockMembersService.getByUserIdAndEventId.mockResolvedValue(mockMember);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.create(1, dto);

      expect(mockMembersService.getByUserIdAndEventId).toHaveBeenCalledWith(
        1,
        10,
      );
      expect(mockCommentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockComment);
    });
  });

  describe('countFromEvent', () => {
    it('should return the comment count for an event', async () => {
      mockCommentRepository.count.mockResolvedValue(5);

      const result = await service.countFromEvent(10);

      expect(mockCommentRepository.count).toHaveBeenCalledWith({
        where: { member: { event: { id: 10 } } },
      });
      expect(result).toBe(5);
    });
  });

  describe('countFromUser', () => {
    it('should return the comment count for a user', async () => {
      mockCommentRepository.count.mockResolvedValue(3);

      const result = await service.countFromUser(1);

      expect(result).toBe(3);
    });
  });
});
