import { ChildEntity } from 'typeorm';
import { Request } from './request.entity';

@ChildEntity('friend_requests')
export class FriendRequest extends Request {}
