/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationError } from 'src/common/exceptions/configuration-error';
import { SeriesListResponseDto } from './dto/series/series-list-response-dto';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { SeriesListDto } from './dto/series/series-list-dto';
import { TmdbApiSeriesMapper } from './mapper/tmdbapi-series-mapper';
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

  async getSeriesListFromTmdb() {
    const url = 'https://api.themoviedb.org/3/discover/tv';
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    };
    const response: AxiosResponse<SeriesListResponseDto> = await firstValueFrom(
      this.httpService.get<SeriesListResponseDto>(url, options).pipe(
        catchError((error: AxiosError) => {
          throw new ExternalApiError(
            `TMDB API Error: ${error.response?.statusText || 'Unknown Error'}`,
          );
        }),
      ),
    );

    const seriesList: SeriesListDto[] =
      TmdbApiSeriesMapper.seriesListResponseDtoToSeriesListDto(response.data);

    return seriesList;
  }
}
