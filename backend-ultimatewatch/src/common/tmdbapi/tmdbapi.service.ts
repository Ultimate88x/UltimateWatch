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

    return this.filterDuplicateMedia(seriesList);
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

    const movieList: TmdbListMediaDto[] =
      TmdbApiMapper.tmdbListMoviesResultDtoToTmdbListMediaDto(response.data);

    return this.filterDuplicateMedia(movieList);
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

    return this.filterDuplicateMedia(seriesList);
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

    return this.filterDuplicateMedia(movieList);
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

  async getProvidersForMovie(id: number) {
    const url = `https://api.themoviedb.org/3/movie/${id}/watch/providers`;
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

  async getMovieGenres() {
    const url = `https://api.themoviedb.org/3/genre/movie/list`;
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

  async getMoviePeople(id: number) {
    const url = `https://api.themoviedb.org/3/movie/${id}/credits`;
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

  private filterDuplicateMedia(
    mediaList: TmdbListMediaDto[],
  ): TmdbListMediaDto[] {
    const seen = new Set();
    return mediaList.filter((item) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  }
}
