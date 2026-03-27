import { Controller, Get, Param } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { MediaType } from 'src/common/tmdbapi/enums/media.type.enum';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get(':mediaTmdbId')
  async getProvidersByMediaTmdbId(@Param('mediaTmdbId') mediaTmdbId: string) {
    const data =
      this.providersService.findProvidersOrGetFromTmdbAndFindOrCreate(
        +mediaTmdbId,
        MediaType.MOVIE,
      );

    return data;
  }
}
