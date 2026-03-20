export type TmdbGenreDto = {
  id: number;
  name: string;
};

export class tmdbListGenreResponseDto {
  genres: TmdbGenreDto[];
}
