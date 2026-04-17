import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventType } from 'src/common/enums/event.type.enum';
import { MediaEventDto } from './media-event-dto';

export class EventDetailedInfoDto {
  id: number;
  name: string;
  description?: string | null;
  eventDate: Date;
  type: EventType;
  status: EventStatus;
  media: MediaEventDto[] | null;
  maxMembers: number;

  constructor(init?: Partial<EventDetailedInfoDto>) {
    Object.assign(this, init);
  }
}
