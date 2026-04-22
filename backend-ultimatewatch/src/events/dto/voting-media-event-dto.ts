import { MediaEventDto } from './media-event-dto';
import { VotingSubMediaEventDto } from './voting-sub-media-event-dto';

export class VotingMediaEventDto extends MediaEventDto {
  declare subMediaEvent?: VotingSubMediaEventDto[] | null | undefined;
  count: number | null | undefined;

  constructor(init?: Partial<VotingMediaEventDto>) {
    super();
    Object.assign(this, init);
  }
}
