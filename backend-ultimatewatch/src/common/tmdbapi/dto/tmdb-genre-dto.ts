export type TmdbGenreDto = {
  id: number;
  name: string;
};

export type tmdbListGenreResponseDto = {
  genres: TmdbGenreDto[];
};
