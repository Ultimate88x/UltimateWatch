export type TmdbCastRoles = {
  character: string;
};

export type TmdbCrewJobs = {
  job: string;
};

export type TmdbCastDto = {
  id: number;
  name: string;
  profile_path: string;
  character?: string;
  roles?: TmdbCastRoles[];
  total_episode_count?: number;
  order: number;
};

export type TmdbCrewDto = {
  id: number;
  name: string;
  profile_path: string;
  job?: string;
  jobs?: TmdbCrewJobs[];
  total_episode_count?: number;
};

export type TmdbPeopleResponseDto = {
  cast: TmdbCastDto[];
  crew: TmdbCrewDto[];
};
