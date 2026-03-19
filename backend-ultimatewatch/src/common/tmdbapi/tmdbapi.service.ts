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

  async getSeriesListFromTmdb(page: number = 1) {
    const url = 'https://api.themoviedb.org/3/discover/tv';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: {
        include_adult: false,
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

    return seriesList;
  }

  async getMovieListFromTmdb(page: number = 1) {
    const url = 'https://api.themoviedb.org/3/discover/movie';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      params: {
        include_adult: false,
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

    const seriesList: TmdbListMediaDto[] =
      TmdbApiMapper.tmdbListMoviesResultDtoToTmdbListMediaDto(response.data);

    return seriesList;
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

    return seriesList;
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

    const movieList: TmdbListMediaDto[] =
      TmdbApiMapper.tmdbListMoviesResultDtoToTmdbListMediaDto(response.data);

    return movieList;
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
}
