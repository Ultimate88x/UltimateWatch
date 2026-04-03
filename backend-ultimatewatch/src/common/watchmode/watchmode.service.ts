import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationError } from '../exceptions/configuration-error';
import { MediaType } from '../enums/media.type.enum';
import { WatchmodeProviderDto } from './dto/watchmode-provider-dto';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { ExternalApiError } from '../exceptions/external-api-error';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class WatchmodeService {
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    const key = this.configService.get<string>('WATCHMODE_API_KEY');

    if (!key) {
      throw new ConfigurationError('Watchmode Configuration');
    }

    this.apiKey = key;
  }

  async getProvidersForMediaFromWatchmode(id: number, type: MediaType) {
    const watchmodeId = `${type.toLowerCase()}-${id}`;
    const url = `https://api.watchmode.com/v1/title/${watchmodeId}/sources/`;
    const options = {
      params: {
        apiKey: this.apiKey,
        regions: 'ES',
      },
      responseType: 'json' as const,
    };

    const response: AxiosResponse<WatchmodeProviderDto[]> =
      await firstValueFrom(
        this.httpService.get<WatchmodeProviderDto[]>(url, options).pipe(
          catchError((error: AxiosError) => {
            throw new ExternalApiError(
              `Watchmode API Error: ${error.response?.statusText || 'Unknown Error'}`,
            );
          }),
        ),
      );

    return response.data;
  }
}
