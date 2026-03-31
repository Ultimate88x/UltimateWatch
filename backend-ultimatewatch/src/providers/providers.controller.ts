import { Controller, Get, Param } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('links/:mediaTmdbId')
  async getProviderLinksByMediaTmdbId(
    @Param('mediaTmdbId') mediaTmdbId: string,
  ) {
    const data = this.providersService.findProviderUrlsForMedia(+mediaTmdbId);

    return data;
  }
}
