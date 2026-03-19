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
import { TmdbListMediaDto } from './dto/media/media-list-dto';
import { TmdbApiListMediaMapper } from './mapper/tmdbapi-series-mapper';
import { ExternalApiError } from 'src/common/exceptions/external-api-error';

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
      TmdbApiListMediaMapper.tmdbListSeriesResultDtoToTmdbListMediaDto(
        response.data,
      );

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
      TmdbApiListMediaMapper.tmdbListMoviesResultDtoToTmdbListMediaDto(
        response.data,
      );

    return seriesList;
  }
}
