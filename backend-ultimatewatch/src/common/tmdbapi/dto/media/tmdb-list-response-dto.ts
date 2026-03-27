export type TmdbListSeriesResultDto = {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
};

export type TmdbListMoviesResultDto = {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
};

export type TmdbListResponseDto<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};
