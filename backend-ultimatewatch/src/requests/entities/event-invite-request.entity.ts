import { Check, ChildEntity, ManyToOne } from 'typeorm';
import { Request } from './request.entity';
import { Event } from '../../events/entities/event.entity';
import { User } from 'src/users/entities/user.entity';

@ChildEntity('event_invite_requests')
@Check('CHK_INVITE_SENDER_RECEIVER', `"senderId" <> "receiverId"`)
export class EventInviteRequest extends Request {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  receiver: User;

  @ManyToOne(() => Event)
  event: Event;
}
