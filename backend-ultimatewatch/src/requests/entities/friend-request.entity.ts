import { Check, ChildEntity, ManyToOne } from 'typeorm';
import { Request } from './request.entity';
import { User } from 'src/users/entities/user.entity';

@ChildEntity('friend_requests')
@Check(`"senderId" <> "receiverId"`)
export class FriendRequest extends Request {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  receiver: User;
}
