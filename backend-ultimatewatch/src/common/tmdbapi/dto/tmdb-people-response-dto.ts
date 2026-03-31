export type TmdbCastDto = {
  id: number;
  name: string;
  profile_path: string;
  character: string;
};

export type TmdbCrewDto = {
  id: number;
  name: string;
  profile_path: string;
  job: string;
};

export type TmdbPeopleResponseDto = {
  cast: TmdbCastDto[];
  crew: TmdbCrewDto[];
};
