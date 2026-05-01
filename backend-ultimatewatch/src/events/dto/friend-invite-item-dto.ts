export class FriendInviteItemDto {
  id: number;
  username: string;
  imagePath: string;
  hasPendingInvite: boolean;

  constructor(init?: Partial<FriendInviteItemDto>) {
    Object.assign(this, init);
  }
}
