export type tmdbGenreDto = {
  id: number;
  name: string;
};

export class tmdbListGenreResponseDto {
  genres: tmdbGenreDto[];
}
