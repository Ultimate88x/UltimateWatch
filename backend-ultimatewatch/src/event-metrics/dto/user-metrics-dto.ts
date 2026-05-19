export class UserMetricsDto {
  createdEvents: number;
  votes: number;
  messages: number;

  constructor(init?: Partial<UserMetricsDto>) {
    Object.assign(this, init);
  }
}
