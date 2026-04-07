import { BadRequestException, Injectable } from '@nestjs/common';
import { Vote } from './entities/vote.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVoteDto } from './dto/create-vote.dto';
import { Member } from 'src/members/entities/member.entity';
import { MembersService } from 'src/members/members.service';
import { MediaService } from 'src/media/media.service';
import { Media } from 'src/media/entities/media.entity';
import { VotingEvent } from 'src/events/entities/voting-event.entity';
import { EventsService } from 'src/events/events.service';
import { DeleteVoteDto } from './dto/delete-vote.dto';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
    private readonly membersService: MembersService,
    private readonly mediaService: MediaService,
    private readonly eventsService: EventsService,
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
    const event: VotingEvent =
      await this.eventsService.findVotingEventBydId(eventId);

    if (new Date() > event.votingEndDate) {
      throw new BadRequestException('The voting period has ended');
    }

    const currentVotes = member.votes?.length || 0;
    if (currentVotes >= event.maxVotesPerMember) {
      throw new BadRequestException("You've already used all your votes");
    }

    const isProposed = event.proposedMedia.some((m) => m.tmdbId === mediaId);
    if (!isProposed) {
      throw new BadRequestException(
        'This media is not part of the voting options',
      );
    }

    const alreadyVoted = member.votes?.some((v) => v.media.tmdbId === mediaId);
    if (alreadyVoted) {
      throw new BadRequestException('You have already voted for this media');
    }

    const media: Media = await this.mediaService.findByTmdbId(mediaId);

    const vote: Vote = this.votesRepository.create({
      member,
      media,
    });

    await this.save(vote);
  }

  async findByMemberIdAndMediaId(
    memberId: number,
    mediaId: number,
  ): Promise<Vote> {
    const vote: Vote | null = await this.votesRepository.findOne({
      where: {
        member: { id: memberId },
        media: { tmdbId: mediaId },
      },
    });

    if (!vote) {
      throw new ResourceNotFoundException(
        'Vote',
        '{ MEMBER_ID, MEDIA_TMDB_ID }',
        `{ ${memberId}, ${mediaId} }`,
      );
    }

    return vote;
  }

  async deleteVote(
    deleteVoteDto: DeleteVoteDto,
    userId: number,
  ): Promise<void> {
    const { eventId, mediaId }: { eventId: number; mediaId: number } =
      deleteVoteDto;
    const member: Member = await this.membersService.findByUserIdAndEventId(
      userId,
      eventId,
    );
    const event: VotingEvent =
      await this.eventsService.findVotingEventBydId(eventId);

    if (new Date() > event.votingEndDate) {
      throw new BadRequestException('The voting period has ended');
    }

    await this.mediaService.findByTmdbId(mediaId);

    const vote: Vote = await this.findByMemberIdAndMediaId(member.id, mediaId);

    await this.votesRepository.delete(vote.id);
  }
}
