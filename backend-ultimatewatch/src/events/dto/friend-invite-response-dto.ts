import { FriendInviteItemDto } from './friend-invite-item-dto';

export class FriendInviteResponseDto {
  data: FriendInviteItemDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<FriendInviteResponseDto>) {
    Object.assign(this, init);
  }
}
