import { Controller, Get } from '@nestjs/common';
import { SeriesService } from './series.service';
import { TmdbApiService } from 'src/tmdbapi/tmdbapi.service';

@Controller('series')
export class SeriesController {
  constructor(
    private readonly seriesService: SeriesService,
    private readonly tmdbapiService: TmdbApiService,
  ) {}

  @Get('tmdb-list')
  async getTmdbSeries() {
    const data = await this.tmdbapiService.getSeriesListFromTmdb();
    return data;
  }
}
