import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventType } from 'src/common/enums/event.type.enum';

export class ListEventDto {
  name: string;
  eventDate: Date;
  type: EventType;
  status: EventStatus;
  creatorName: string;
  creatorImagePath: string;
  mediaTitles?: string | null;
  mainImagePath?: string | null;

  constructor(init?: Partial<ListEventDto>) {
    Object.assign(this, init);
  }
}
