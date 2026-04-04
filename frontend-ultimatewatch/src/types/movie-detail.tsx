import type { ProductionCompany } from "./production-company";

type MovieDetail = {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  status: string;
  genres: string[];
  productionCompanies: ProductionCompany[];
  budget: number;
  runtime: number;
  revenue: number;
  releaseDate: string;
};

export type {MovieDetail}