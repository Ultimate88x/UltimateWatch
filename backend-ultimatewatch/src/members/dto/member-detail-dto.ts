export class MemberDetailDto {
  userId: number;
  name: string;
  imagePath: string;
  role: string;
  isCurrentUser: boolean;

  constructor(init?: Partial<MemberDetailDto>) {
    Object.assign(this, init);
  }
}
