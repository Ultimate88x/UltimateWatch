import { Controller, Get, Query } from '@nestjs/common';
import { SeriesService } from './series.service';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { SeriesListDto } from 'src/common/tmdbapi/dto/series/series-list-dto';

@Controller('series')
export class SeriesController {
  constructor(
    private readonly seriesService: SeriesService,
    private readonly tmdbapiService: TmdbApiService,
  ) {}

  @Get('tmdb-list')
  async getTmdbSeries(
    @Query('page') page: string = '1',
  ): Promise<SeriesListDto[]> {
    const data: SeriesListDto[] =
      await this.seriesService.getSeriesListForWholePage(+page);
    return data;
  }
}
