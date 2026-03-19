import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SeriesService } from './series.service';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';

@Controller('series')
export class SeriesController {
  constructor(
    private readonly seriesService: SeriesService,
    private readonly tmdbapiService: TmdbApiService,
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
}
