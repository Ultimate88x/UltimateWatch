import { TmdbGenreDto } from './tmdb-genre-dto';
import { TmdbProductionCompanyDto } from './tmdb-production-company-dto';

export class TmdbMovieDto {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  popularity: number;
  status: string;
  budget: number;
  runtime: number;
  revenue: number;
  release_date: string;
  genres: TmdbGenreDto[];
  production_companies: TmdbProductionCompanyDto[];
}
