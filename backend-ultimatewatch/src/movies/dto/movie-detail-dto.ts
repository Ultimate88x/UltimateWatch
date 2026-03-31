export class MovieDetailDto {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  status: string;
  genres: string[];
  productionCompanies: string[];
  budget: number;
  runtime: number;
  revenue: number;
  releaseDate: string;

  constructor(init?: Partial<MovieDetailDto>) {
    Object.assign(this, init);
  }
}
