export class GenreDetailDto {
  tmdbId: number;
  name: string;

  constructor(init?: Partial<GenreDetailDto>) {
    Object.assign(this, init);
  }
}
