import { RequestDto } from './request-dto';

export class FriendRequestDto extends RequestDto {
  constructor(init?: Partial<FriendRequestDto>) {
    super();
    Object.assign(this, init);
  }
}
