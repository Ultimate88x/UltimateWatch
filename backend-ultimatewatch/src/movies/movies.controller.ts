import { Controller, Get, Query } from '@nestjs/common';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { MoviesService } from './movies.service';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/media-list-dto';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly tmdbapiService: TmdbApiService,
  ) {}

  @Get('tmdb-list')
  async getTmdbSeries(
    @Query('page') page: string = '1',
  ): Promise<TmdbListMediaDto[]> {
    const data: TmdbListMediaDto[] =
      await this.moviesService.getMovieListForWholePage(+page);
    return data;
  }
}
