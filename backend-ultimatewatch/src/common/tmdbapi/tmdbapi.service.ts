import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationError } from 'src/common/exceptions/configuration-error';
import {
  TmdbListMoviesResultDto,
  TmdbListResponseDto,
  TmdbListSeriesResultDto,
} from './dto/media/tmdb-list-response-dto';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { TmdbListMediaDto } from './dto/media/tmdb-media-list-dto';
import { TmdbApiMapper } from './mapper/tmdbapi-mapper';
import { ExternalApiError } from 'src/common/exceptions/external-api-error';
import { TmdbMovieDto } from './dto/media/tmdb-movie-dto';
import { TmdbGenreDto, TmdbListGenreResponseDto } from './dto/tmdb-genre-dto';
import {
  TmdbProviderInfoDto,
  TmdbProviderResponse,
} from './dto/tmdb-provider-response-dto';
import { TmdbProductionCompanyDto } from './dto/tmdb-production-company-dto';
import { TmdbPeopleResponseDto } from './dto/tmdb-people-response-dto';
import { TmdbSeriesDto } from './dto/media/tmdb-series-dto';
import { TmdbSeasonDto } from './dto/media/tmdb-season-dto';
import { MediaType } from '../enums/media.type.enum';
import { getSafeSortBy } from '../helpers/valid-sorts.helper';
import { MediaFilterDto } from '../dto/media-filter-dto';
import { TmdbParamsDto } from './dto/tmdb-params-dto';

@Injectable()
export class TmdbApiService {
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const key = this.configService.get<string>('TMDB_API_KEY');

    if (!key) {
      throw new ConfigurationError('Tmdb Configuration');
    }

    this.apiKey = key;
  }

  async getSeriesListFromTmdb(
    page: number = 1,
    sort?: string,
    mediaFilter?: MediaFilterDto,
  ) {
    const url = 'https://api.themoviedb.org/3/discover/tv';
    const validSort = getSafeSortBy(MediaType.SERIES, sort);

    const params: TmdbParamsDto = {
      include_adult: false,
      page: page,
      sort_by: validSort,
      ...(mediaFilter
        ? TmdbApiMapper.mapFiltersToTmdb(mediaFilter, MediaType.SERIES)
        : {}),
    };

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: params,
    };

    const response: AxiosResponse<
      TmdbListResponseDto<TmdbListSeriesResultDto>
    > = await firstValueFrom(
      this.httpService
        .get<TmdbListResponseDto<TmdbListSeriesResultDto>>(url, options)
        .pipe(
          catchError((error: AxiosError) => {
            throw new ExternalApiError(
              `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
            );
          }),
        ),
    );

    const seriesList: TmdbListMediaDto[] =
      TmdbApiMapper.tmdbListSeriesResultDtoToTmdbListMediaDto(response.data);

    return TmdbApiMapper.filterDuplicateMedia(seriesList);
  }

  async getMovieListFromTmdb(
    page: number = 1,
    sort?: string,
    mediaFilter?: MediaFilterDto,
  ) {
    const url = 'https://api.themoviedb.org/3/discover/movie';
    const validSort = getSafeSortBy(MediaType.MOVIE, sort);

    const params: TmdbParamsDto = {
      include_adult: false,
      page: page,
      sort_by: validSort,
      ...(mediaFilter
        ? TmdbApiMapper.mapFiltersToTmdb(mediaFilter, MediaType.MOVIE)
        : {}),
    };

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: params,
    };

    const response: AxiosResponse<
      TmdbListResponseDto<TmdbListMoviesResultDto>
    > = await firstValueFrom(
      this.httpService
        .get<TmdbListResponseDto<TmdbListMoviesResultDto>>(url, options)
        .pipe(
          catchError((error: AxiosError) => {
            throw new ExternalApiError(
              `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
            );
          }),
        ),
    );

    const movies: TmdbListMoviesResultDto[] = response.data.results;
    const totalPages: number = response.data.total_pages;

    return { mediaList: movies, totalPages };
  }

  async searchSeriesFromTmdb(query: string, page: number = 1) {
    const url = 'https://api.themoviedb.org/3/search/tv';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: {
        include_adult: false,
        query: encodeURIComponent(query),
        page: page,
      },
    };
    const response: AxiosResponse<
      TmdbListResponseDto<TmdbListSeriesResultDto>
    > = await firstValueFrom(
      this.httpService
        .get<TmdbListResponseDto<TmdbListSeriesResultDto>>(url, options)
        .pipe(
          catchError((error: AxiosError) => {
            throw new ExternalApiError(
              `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
            );
          }),
        ),
    );

    const seriesList: TmdbListMediaDto[] =
      TmdbApiMapper.tmdbListSeriesResultDtoToTmdbListMediaDto(response.data);

    return TmdbApiMapper.filterDuplicateMedia(seriesList);
  }

  async searchMoviesFromTmdb(query: string, page: number = 1) {
    const url = 'https://api.themoviedb.org/3/search/movie';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: {
        include_adult: false,
        query: encodeURIComponent(query),
        page: page,
      },
    };
    const response: AxiosResponse<
      TmdbListResponseDto<TmdbListMoviesResultDto>
    > = await firstValueFrom(
      this.httpService
        .get<TmdbListResponseDto<TmdbListMoviesResultDto>>(url, options)
        .pipe(
          catchError((error: AxiosError) => {
            throw new ExternalApiError(
              `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
            );
          }),
        ),
    );

    const movies: TmdbListMoviesResultDto[] = response.data.results;
    const totalPages: number = response.data.total_pages;

    return { mediaList: movies, totalPages };
  }

  async getMovieFromTmdb(id: number) {
    const url = `https://api.themoviedb.org/3/movie/${id}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<TmdbMovieDto> = await firstValueFrom(
      this.httpService.get<TmdbMovieDto>(url, options).pipe(
        catchError((error: AxiosError) => {
          throw new ExternalApiError(
            `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
          );
        }),
      ),
    );

    const movie: TmdbMovieDto = response.data;

    return movie;
  }

  async getSeriesFromTmdb(id: number) {
    const url = `https://api.themoviedb.org/3/tv/${id}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<TmdbSeriesDto> = await firstValueFrom(
      this.httpService.get<TmdbSeriesDto>(url, options).pipe(
        catchError((error: AxiosError) => {
          throw new ExternalApiError(
            `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
          );
        }),
      ),
    );

    const series: TmdbSeriesDto = response.data;

    return series;
  }

  async getSeasonFromTmdb(seriesId: number, seasonNumber: number) {
    const url = `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<TmdbSeasonDto> = await firstValueFrom(
      this.httpService.get<TmdbSeasonDto>(url, options).pipe(
        catchError((error: AxiosError) => {
          throw new ExternalApiError(
            `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
          );
        }),
      ),
    );

    const season: TmdbSeasonDto = response.data;

    return season;
  }

  async getProvidersForMedia(id: number, mediaType: MediaType) {
    const url = `https://api.themoviedb.org/3/${mediaType}/${id}/watch/providers`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<TmdbProviderResponse> = await firstValueFrom(
      this.httpService.get<TmdbProviderResponse>(url, options).pipe(
        catchError((error: AxiosError) => {
          throw new ExternalApiError(
            `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
          );
        }),
      ),
    );

    const provider: TmdbProviderInfoDto | undefined = response.data.results.ES;

    return provider;
  }

  async getMediaGenres(mediaType: MediaType) {
    const url = `https://api.themoviedb.org/3/genre/${mediaType}/list`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<TmdbListGenreResponseDto> =
      await firstValueFrom(
        this.httpService.get<TmdbListGenreResponseDto>(url, options).pipe(
          catchError((error: AxiosError) => {
            throw new ExternalApiError(
              `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
            );
          }),
        ),
      );

    const genreList: TmdbGenreDto[] = response.data.genres;

    return genreList;
  }

  async getMediaPeople(id: number, mediaType: MediaType) {
    const url =
      mediaType === MediaType.MOVIE
        ? `https://api.themoviedb.org/3/${mediaType}/${id}/credits`
        : `https://api.themoviedb.org/3/${mediaType}/${id}/aggregate_credits`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<TmdbPeopleResponseDto> = await firstValueFrom(
      this.httpService.get<TmdbPeopleResponseDto>(url, options).pipe(
        catchError((error: AxiosError) => {
          throw new ExternalApiError(
            `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
          );
        }),
      ),
    );

    const peopleList: TmdbPeopleResponseDto = response.data;

    return peopleList;
  }

  async getProductionCompanyFromTmdb(id: number) {
    const url = `https://api.themoviedb.org/3/company/${id}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<TmdbProductionCompanyDto> =
      await firstValueFrom(
        this.httpService.get<TmdbProductionCompanyDto>(url, options).pipe(
          catchError((error: AxiosError) => {
            throw new ExternalApiError(
              `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
            );
          }),
        ),
      );

    const productionCompany: TmdbProductionCompanyDto = response.data;

    return productionCompany;
  }
}
