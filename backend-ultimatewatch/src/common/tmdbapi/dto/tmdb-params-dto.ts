export type TmdbParamsDto = {
  include_adult: boolean;
  page: number;
  sort_by: string;
  with_genres?: string;
  without_genres?: string;
  [key: string]: string | number | boolean | undefined;
};
