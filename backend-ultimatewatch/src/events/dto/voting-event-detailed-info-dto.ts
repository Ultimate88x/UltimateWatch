import { EventDetailedInfoDto } from './event-detailed-info-dto';
import { MediaEventDto } from './media-event-dto';
import { VotingMediaEventDto } from './voting-media-event-dto';

export class VotingEventDetailedInfoDto extends EventDetailedInfoDto<
  VotingMediaEventDto | MediaEventDto
> {
  maxMedia: number;
  maxVotesPerMember: number;
  votingEndDate: Date;

  constructor(init?: Partial<VotingEventDetailedInfoDto>) {
    super();
    Object.assign(this, init);
  }
}
