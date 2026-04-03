import { ChildEntity } from 'typeorm';
import { Request } from './request.entity';

@ChildEntity('friend_request')
export class FriendRequest extends Request {}
