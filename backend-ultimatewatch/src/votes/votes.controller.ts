import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Get,
  Param,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { VoteResultDto } from './dto/vote-result.dto';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @GetUser('userId') userId: number,
    @Body() createVoteDto: CreateVoteDto,
  ): Promise<{ message: string }> {
    await this.votesService.createVote(createVoteDto, userId);

    return { message: 'Vote created succesfully!' };
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(
    @GetUser('userId') userId: number,
    @Body() createVoteDto: CreateVoteDto,
  ): Promise<{ message: string }> {
    await this.votesService.deleteVote(createVoteDto, userId);

    return { message: 'Vote deleted succesfully!' };
  }

  @Get('results/:eventId')
  @UseGuards(AuthGuard)
  async getEventVotingResults(
    @Param('eventId') eventId: number,
  ): Promise<VoteResultDto[]> {
    const voteResults: VoteResultDto[] =
      await this.votesService.getResultsByEvent(eventId, false);

    return voteResults;
  }
}
