import { TmdbEpisodeDto } from './tmdb-episode-dto';

export type TmdbSeasonDto = {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  air_date: string;
  episodes: TmdbEpisodeDto[];
};
