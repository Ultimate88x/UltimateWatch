export type TmdbListMediaResultDto = {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
};

export class TmdbListResponseDto {
  page: number;
  results: TmdbListMediaResultDto[];
  total_pages: number;
  total_results: number;
}
