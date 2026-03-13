import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationError } from 'src/common/exceptions/configuration-error';

@Injectable()
export class TmdbapiService {
  constructor(private configService: ConfigService) {
    const apiKey: string | undefined =
      this.configService.get<string>('TMDB_API_KEY');

    if (!apiKey) {
      throw new ConfigurationError('Tmdb Configuration');
    }
  }
}
