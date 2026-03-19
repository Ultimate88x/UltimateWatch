export type TmdbSeriesResult = {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
};

export class SeriesListResponseDto {
  page: number;
  results: TmdbSeriesResult[];
  total_pages: number;
  total_results: number;
}
