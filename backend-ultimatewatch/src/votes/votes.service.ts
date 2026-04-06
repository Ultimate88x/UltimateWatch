import { Injectable } from '@nestjs/common';
import { Vote } from './entities/vote.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVoteDto } from './dto/create-vote.dto';
import { Member } from 'src/members/entities/member.entity';
import { MembersService } from 'src/members/members.service';
import { MediaService } from 'src/media/media.service';
import { Media } from 'src/media/entities/media.entity';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
    private readonly membersService: MembersService,
    private readonly mediaService: MediaService,
  ) {}

  async save(vote: Vote): Promise<Vote> {
    return await this.votesRepository.save(vote);
  }

  async createVote(
    createVoteDto: CreateVoteDto,
    userId: number,
  ): Promise<void> {
    const { eventId, mediaId }: { eventId: number; mediaId: number } =
      createVoteDto;
    const member: Member = await this.membersService.findByUserIdAndEventId(
      userId,
      eventId,
    );
    const media: Media = await this.mediaService.findByTmdbId(mediaId);

    const vote: Vote = this.votesRepository.create({
      member,
      media,
    });

    await this.save(vote);
  }
}
