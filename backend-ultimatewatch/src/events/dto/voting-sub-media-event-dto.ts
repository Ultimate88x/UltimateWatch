import { SubMediaEventDto } from './sub-media-event-dto';

export class VotingSubMediaEventDto extends SubMediaEventDto {
  count: number;

  constructor(init?: Partial<VotingSubMediaEventDto>) {
    super();
    Object.assign(this, init);
  }
}
