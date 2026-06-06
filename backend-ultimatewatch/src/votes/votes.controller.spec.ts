/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CreateVoteDto } from './dto/create-vote.dto';
import { DeleteVoteDto } from './dto/delete-vote.dto';

describe('VotesController', () => {
  let controller: VotesController;
  let service: VotesService;

  const mockVotesService = {
    findVotedMediaIdsByUserIdAndEventId: jest.fn(),
    createVote: jest.fn(),
    deleteVote: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotesController],
      providers: [
        {
          provide: VotesService,
          useValue: mockVotesService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<VotesController>(VotesController);
    service = module.get<VotesService>(VotesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVotedMediaIdsByUserIdAndEventId', () => {
    const userId = 1;
    const eventId = 10;

    it('should call service.findVotedMediaIdsByUserIdAndEventId and return media ids', async () => {
      const expectedResponse = [101, 102, 103];
      mockVotesService.findVotedMediaIdsByUserIdAndEventId.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.getVotedMediaIdsByUserIdAndEventId(
        userId,
        eventId,
      );

      expect(service.findVotedMediaIdsByUserIdAndEventId).toHaveBeenCalledWith(
        userId,
        eventId,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from the service', async () => {
      mockVotesService.findVotedMediaIdsByUserIdAndEventId.mockRejectedValue(
        new Error('EventNotFoundException'),
      );

      await expect(
        controller.getVotedMediaIdsByUserIdAndEventId(userId, eventId),
      ).rejects.toThrow('EventNotFoundException');
    });
  });

  describe('create', () => {
    const userId = 1;
    const createVoteDto = { mediaId: 101, eventId: 10 } as CreateVoteDto;

    it('should call service.createVote and return a success message', async () => {
      mockVotesService.createVote.mockResolvedValue(undefined);

      const result = await controller.create(userId, createVoteDto);

      expect(service.createVote).toHaveBeenCalledWith(createVoteDto, userId);
      expect(result).toEqual({ message: 'Vote created succesfully!' });
    });

    it('should propagate errors from the service', async () => {
      mockVotesService.createVote.mockRejectedValue(
        new Error('AlreadyVotedException'),
      );

      await expect(controller.create(userId, createVoteDto)).rejects.toThrow(
        'AlreadyVotedException',
      );
    });
  });

  describe('delete', () => {
    const userId = 1;
    const deleteVoteDto = { mediaId: 101, eventId: 10 } as DeleteVoteDto;

    it('should call service.deleteVote and return a success message', async () => {
      mockVotesService.deleteVote.mockResolvedValue(undefined);

      const result = await controller.delete(userId, deleteVoteDto);

      expect(service.deleteVote).toHaveBeenCalledWith(deleteVoteDto, userId);
      expect(result).toEqual({ message: 'Vote deleted succesfully!' });
    });

    it('should propagate errors from the service', async () => {
      mockVotesService.deleteVote.mockRejectedValue(
        new Error('VoteNotFoundException'),
      );

      await expect(controller.delete(userId, deleteVoteDto)).rejects.toThrow(
        'VoteNotFoundException',
      );
    });
  });
});
