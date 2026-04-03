import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { SeriesService } from './series.service';
import { ProvidersService } from 'src/providers/providers.service';
import { SeriesDetailDto } from './dto/series-detail-dto';
import { ProviderListItemDto } from 'src/providers/dto/provider-list-item-dto';
import { MediaType } from 'src/common/enums/media.type.enum';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';

@Controller('series')
export class SeriesController {
  constructor(
    private readonly seriesService: SeriesService,
    private readonly providersService: ProvidersService,
  ) {}

  @Get('tmdb-list')
  async getTmdbSeries(@Query() filters: MediaFilterDto): Promise<MediaListDto> {
    const page = filters.page || 1;
    const sort = filters.sort;
    const data: MediaListDto =
      await this.seriesService.getSeriesListForWholePage(+page, sort, filters);
    return data;
  }

  @Get('tmdb-search')
  async searchTmdbSeries(
    @Query('query') query: string,
    @Query('page') page: string = '1',
  ): Promise<MediaListDto> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    const data: MediaListDto =
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
