import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventType } from 'src/common/enums/event.type.enum';

export class ListEventDto {
  name: string;
  description?: string | null;
  eventDate: Date;
  type: EventType;
  status: EventStatus;
  creatorName: string;
  creatorImagePath: string;

  constructor(init?: Partial<ListEventDto>) {
    Object.assign(this, init);
  }
}
