import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { MoviesService } from './movies.service';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly tmdbapiService: TmdbApiService,
  ) {}

  @Get('tmdb-list')
  async getTmdbMovies(
    @Query('page') page: string = '1',
  ): Promise<TmdbListMediaDto[]> {
    const data: TmdbListMediaDto[] =
      await this.moviesService.getMovieListForWholePage(+page);
    return data;
  }

  @Get('tmdb-search')
  async searchTmdbMovies(
    @Query('query') query: string,
    @Query('page') page: string = '1',
  ): Promise<TmdbListMediaDto[]> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    const data: TmdbListMediaDto[] =
      await this.moviesService.searchMoviesForWholePage(query, +page);
    return data;
  }

  @Get(':id')
  async getMovieByTmdbId(@Param('id') id: string) {
    const data = await this.moviesService.findMovieFromTmdbId(+id);
    return data;
  }
}
