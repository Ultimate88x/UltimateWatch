export class SeasonListDto {
  tmdbId: number;
  title: string;
  number: number;

  constructor(init?: Partial<SeasonListDto>) {
    Object.assign(this, init);
  }
}
