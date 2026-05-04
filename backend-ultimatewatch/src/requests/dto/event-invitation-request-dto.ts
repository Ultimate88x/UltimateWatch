import { RequestDto } from './request-dto';

export class EventInvitationRequestDto extends RequestDto {
  eventId: number;
  eventName: string;

  constructor(init?: Partial<EventInvitationRequestDto>) {
    super();
    Object.assign(this, init);
  }
}
