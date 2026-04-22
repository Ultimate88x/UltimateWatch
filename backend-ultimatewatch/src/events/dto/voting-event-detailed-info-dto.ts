import { EventDetailedInfoDto } from './event-detailed-info-dto';

export class VotingEventDetailedInfoDto extends EventDetailedInfoDto {
  maxMedia: number;
  maxVotesPerMember: number;
  votingEndDate: Date;

  constructor(init?: Partial<VotingEventDetailedInfoDto>) {
    super();
    Object.assign(this, init);
  }
}
