import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationError } from '../exceptions/configuration-error';

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
}
