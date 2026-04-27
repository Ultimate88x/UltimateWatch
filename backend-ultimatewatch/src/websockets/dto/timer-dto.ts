export class TimerDto {
  seconds: number;
  isActive: boolean;

  constructor(init?: Partial<TimerDto>) {
    Object.assign(this, init);
  }
}
