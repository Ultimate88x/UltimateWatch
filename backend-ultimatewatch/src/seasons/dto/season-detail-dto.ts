export class SeasonDetailDto {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  number: number;
  releaseDate: string | null;

  constructor(init?: Partial<SeasonDetailDto>) {
    Object.assign(this, init);
  }
}
