import { EventStatus } from 'src/common/enums/event.status.enum';
import { EventType } from 'src/common/enums/event.type.enum';
import { EventVisibility } from 'src/common/enums/event.visibility.enum';

export class EventDetailedInfoDto {
  id: number;
  name: string;
  description?: string | null;
  eventDate: Date;
  type: EventType;
  visibility: EventVisibility;
  status: EventStatus;
  maxMembers: number;
  isRecurring: boolean;

  constructor(init?: Partial<EventDetailedInfoDto>) {
    Object.assign(this, init);
  }
}
