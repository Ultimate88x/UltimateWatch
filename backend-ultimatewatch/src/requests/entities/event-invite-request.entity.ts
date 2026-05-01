import { ChildEntity, ManyToOne } from 'typeorm';
import { Request } from './request.entity';
import { Event } from '../../events/entities/event.entity';

@ChildEntity('event_invite_requests')
export class EventInviteRequest extends Request {
  @ManyToOne(() => Event)
  event: Event;
}
