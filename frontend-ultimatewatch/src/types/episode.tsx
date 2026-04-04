type Episode = {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  number: number;
  releaseDate: string | null;
  runtime: number;
  type: string;
};

export type {Episode}