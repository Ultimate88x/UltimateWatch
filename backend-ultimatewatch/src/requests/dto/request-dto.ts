export class RequestDto {
  id: number;
  username: string;
  userImagePath: string;
  createdAt: string;

  constructor(init?: Partial<RequestDto>) {
    Object.assign(this, init);
  }
}
