import type { ProductionCompany } from "./production-company";
import type { SeasonBasic } from "./season-basic";

type SeriesDetail = {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  status: string;
  genres: string[];
  productionCompanies: ProductionCompany[];
  releaseDate: string | null;
  lastAirDate: string | null;
  seasonsNumber: number;
  seasonsInfo: SeasonBasic[];
};

export type {SeriesDetail}