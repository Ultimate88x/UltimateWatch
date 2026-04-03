export class UserDetailDto {
  id: number;
  username: string;
  email: string;
  imagePath: string;

  constructor(init?: Partial<UserDetailDto>) {
    Object.assign(this, init);
  }
}
