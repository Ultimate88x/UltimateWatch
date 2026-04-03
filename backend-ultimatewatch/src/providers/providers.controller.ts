import { Controller, Get, Query } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { MediaProviderQueryDto } from './dto/media-provider-query-dto';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('link')
  async getProviderLinkByMediaTmdbIdAndProviderTmdbId(
    @Query() mediaProviderQuery: MediaProviderQueryDto,
  ) {
    const data = await this.providersService.findProviderUrlForMediaAndProvider(
      mediaProviderQuery.mediaTmdbId,
      mediaProviderQuery.providerTmdbId,
    );

    return data;
  }
}
