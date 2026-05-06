import { ChildEntity, ManyToOne } from 'typeorm';
import { Request } from './request.entity';
import { Event } from '../../events/entities/event.entity';

@ChildEntity('event_access_requests')
export class EventAccessRequest extends Request {
  @ManyToOne(() => Event)
  event: Event;
}
