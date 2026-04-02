import { Controller, Get } from '@nestjs/common';
import { GenresService } from './genres.service';
import { GenreDetailDto } from './dto/genre-list-dto';

@Controller('genres')
export class GenresController {
  constructor(private readonly genreService: GenresService) {}

  @Get('/movie')
  async getMovieGenres(): Promise<GenreDetailDto[]> {
    const data: GenreDetailDto[] = await this.genreService.findForMovies();
    return data;
  }

  @Get('/series')
  async getSeriesGenres(): Promise<GenreDetailDto[]> {
    const data: GenreDetailDto[] = await this.genreService.findForSeries();
    return data;
  }
}
