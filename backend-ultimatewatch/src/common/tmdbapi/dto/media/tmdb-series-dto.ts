import { TmdbGenreDto } from '../tmdb-genre-dto';
import { TmdbProductionCompanyDto } from '../tmdb-production-company-dto';
import { TmdbSeasonDto } from './tmdb-season-dto';

export type TmdbSeriesDto = {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  status: string;
  first_air_date: string;
  last_air_date: string;
  genres: TmdbGenreDto[];
  production_companies: TmdbProductionCompanyDto[];
  seasons: TmdbSeasonDto[];
};
