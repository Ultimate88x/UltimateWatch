import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { PersonService } from 'src/person/person.service';
import { MovieDetailDto } from './dto/movie-detail-dto';
import { MediaType } from 'src/common/enums/media.type.enum';
import { MediaPeopleResponseDto } from 'src/person/dto/media-people-dto';
import { ProvidersService } from 'src/providers/providers.service';
import { ProviderListItemDto } from 'src/providers/dto/provider-list-item-dto';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly moviesService: MoviesService,
    private readonly providersService: ProvidersService,
    private readonly personService: PersonService,
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
  async getMovieByTmdbId(@Param('id') id: string): Promise<{
    movie: MovieDetailDto;
    providers: ProviderListItemDto[] | null;
    people: MediaPeopleResponseDto | null;
  }> {
    const movie: MovieDetailDto =
      await this.moviesService.findMovieFromTmdbId(+id);

    const providers: ProviderListItemDto[] | null =
      await this.providersService.findProvidersOrGetFromTmdbAndFindOrCreate(
        +id,
        MediaType.MOVIE,
      );

    const people: MediaPeopleResponseDto | null =
      await this.personService.findPeopleOrGetFromTmdbAndFindOrCreate(
        +id,
        MediaType.MOVIE,
      );

    return {
      movie: movie,
      providers: providers,
      people: people,
    };
  }
}
