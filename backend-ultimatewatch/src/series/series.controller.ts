import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { ProvidersService } from 'src/providers/providers.service';
import { SeriesDetailDto } from './dto/series-detail-dto';
import { ProviderListItemDto } from 'src/providers/dto/provider-list-item-dto';
import { MediaType } from 'src/common/enums/media.type.enum';

@Controller('series')
export class SeriesController {
  constructor(
    private readonly seriesService: SeriesService,
    private readonly providersService: ProvidersService,
  ) {}

  @Get('tmdb-list')
  async getTmdbSeries(
    @Query('page') page: string = '1',
  ): Promise<TmdbListMediaDto[]> {
    const data: TmdbListMediaDto[] =
      await this.seriesService.getSeriesListForWholePage(+page);
    return data;
  }

  @Get('tmdb-search')
  async searchTmdbSeries(
    @Query('query') query: string,
    @Query('page') page: string = '1',
  ): Promise<TmdbListMediaDto[]> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    const data: TmdbListMediaDto[] =
      await this.seriesService.searchSeriesForWholePage(query, +page);
    return data;
  }

  @Get(':id')
  async getSeriesByTmdbId(@Param('id') id: string): Promise<{
    series: SeriesDetailDto;
    providers: ProviderListItemDto[] | null;
  }> {
    const series: SeriesDetailDto =
      await this.seriesService.findSeriesFromTmdbId(+id);

    const providers: ProviderListItemDto[] | null =
      await this.providersService.findProvidersOrGetFromTmdbAndFindOrCreate(
        +id,
        MediaType.SERIES,
      );

    return {
      series: series,
      providers: providers,
    };
  }
}
