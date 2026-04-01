export class EpisodeDetailDto {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  number: number;
  releaseDate: string | null;
  runtime: number;
  type: string;

  constructor(init?: Partial<EpisodeDetailDto>) {
    Object.assign(this, init);
  }
}
