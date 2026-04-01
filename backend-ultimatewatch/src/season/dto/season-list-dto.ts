export class SeasonListDto {
  tmdbId: number;
  title: string;

  constructor(init?: Partial<SeasonListDto>) {
    Object.assign(this, init);
  }
}
