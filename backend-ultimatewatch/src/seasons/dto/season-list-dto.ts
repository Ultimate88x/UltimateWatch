export class SeasonListDto {
  title: string;
  number: number;

  constructor(init?: Partial<SeasonListDto>) {
    Object.assign(this, init);
  }
}
