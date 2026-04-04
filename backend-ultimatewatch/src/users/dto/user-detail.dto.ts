export class UserDetailDto {
  id: number;
  username: string;
  email: string;
  imagePath: string;
  relationStatus?: 'pending' | 'accepted' | 'none';

  constructor(init?: Partial<UserDetailDto>) {
    Object.assign(this, init);
  }
}
