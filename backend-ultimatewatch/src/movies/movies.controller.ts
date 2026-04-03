import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MovieDetailDto } from './dto/movie-detail-dto';
import { MediaType } from 'src/common/enums/media.type.enum';
import { ProvidersService } from 'src/providers/providers.service';
import { ProviderListItemDto } from 'src/providers/dto/provider-list-item-dto';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly providersService: ProvidersService,
  ) {}

  @Get('tmdb-list')
  async getTmdbMovies(@Query() filters: MediaFilterDto): Promise<MediaListDto> {
    const page = filters.page || 1;
    const sort = filters.sort;
    const data: MediaListDto =
      await this.moviesService.getMovieListForWholePage(+page, sort, filters);
    return data;
  }

  @Get('tmdb-search')
  async searchTmdbMovies(
    @Query('query') query: string,
    @Query('page') page: string = '1',
  ): Promise<MediaListDto> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter is required');
    }

    const data: MediaListDto =
      await this.moviesService.searchMoviesForWholePage(query, +page);
    return data;
  }

  @Get(':id')
  async getMovieByTmdbId(@Param('id') id: string): Promise<{
    movie: MovieDetailDto;
    providers: ProviderListItemDto[] | null;
  }> {
    const movie: MovieDetailDto =
      await this.moviesService.findMovieFromTmdbId(+id);

    const providers: ProviderListItemDto[] | null =
      await this.providersService.findProvidersOrGetFromTmdbAndFindOrCreate(
        +id,
        MediaType.MOVIE,
      );

    return {
      movie: movie,
      providers: providers,
    };
  }
}
