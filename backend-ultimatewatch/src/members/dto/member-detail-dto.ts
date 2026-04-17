export class MemberDetailDto {
  name: string;
  imagePath: string;
  role: string;

  constructor(init?: Partial<MemberDetailDto>) {
    Object.assign(this, init);
  }
}
