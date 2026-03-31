export type TmdbGenreDto = {
  id: number;
  name: string;
};

export type TmdbListGenreResponseDto = {
  genres: TmdbGenreDto[];
};
