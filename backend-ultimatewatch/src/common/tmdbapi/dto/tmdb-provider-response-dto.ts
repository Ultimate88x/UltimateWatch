export type TmdbProviderDto = {
  provider_id: number;
  logo_path: string;
  provider_name: string;
};

export type TmdbProviderInfoDto = {
  buy: TmdbProviderDto[];
  flatrate: TmdbProviderDto[];
  rent: TmdbProviderDto[];
};

export type TmdbProviderConuntryInfoDto = {
  ES?: TmdbProviderInfoDto;
};

export type TmdbProviderResponse = {
  results: TmdbProviderConuntryInfoDto;
};
