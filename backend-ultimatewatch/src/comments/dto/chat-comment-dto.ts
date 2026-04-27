export class ChatCommentDto {
  username: string;
  userRole: string;
  message: string;
  createdAt: Date;

  constructor(init?: Partial<ChatCommentDto>) {
    Object.assign(this, init);
  }
}
