import { Injectable } from '@nestjs/common';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Movie } from './entities/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TmdbMovieDto } from 'src/common/tmdbapi/dto/media/tmdb-movie-dto';
import { MediaType } from 'src/genres/enums/media.type.enum';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresService } from 'src/genres/genres.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly tmdbApiService: TmdbApiService,
    private readonly genresService: GenresService,
  ) {}

  private async fetchFourPages(
    page: number,
    fetchFn: (page: number) => Promise<TmdbListMediaDto[]>,
  ): Promise<TmdbListMediaDto[]> {
    const finalList: TmdbListMediaDto[] = [];
    const startPage = (page - 1) * 4 + 1;

    for (let i = 0; i < 4; i++) {
      const currentPage = startPage + i;
      const list = await fetchFn(currentPage);
      finalList.push(...list);
    }

    return finalList;
  }

  async getMovieListForWholePage(page: number = 1) {
    return this.fetchFourPages(page, (p) =>
      this.tmdbApiService.getMovieListFromTmdb(p),
    );
  }

  async searchMoviesForWholePage(query: string, page: number = 1) {
    return this.fetchFourPages(page, (p) =>
      this.tmdbApiService.searchMoviesFromTmdb(query, p),
    );
  }

  async create(movie: TmdbMovieDto) {
    const mappedMovie: Movie = TmdbApiMapper.tmdbMovieDtoToMovie(movie);

    const genres: Genre[] = TmdbApiMapper.tmdbGenreDtoListToGenreList(
      movie.genres,
      MediaType.MOVIE,
    );
    mappedMovie.genres = await Promise.all(
      genres.map((genre: Genre) =>
        this.genresService.findByTmdbId(genre.tmdbId),
      ),
    );
    mappedMovie.popularity = 1;

    return await this.movieRepository.save(mappedMovie);
  }

  async findMovieFromTmdbId(tmdbId: number) {
    const existingMovie = await this.movieRepository.findOne({
      where: { tmdbId },
    });

    if (existingMovie) {
      existingMovie.popularity++;
      return await this.movieRepository.save(existingMovie);
    }

    const movie: TmdbMovieDto =
      await this.tmdbApiService.getMovieFromTmdb(tmdbId);

    return await this.create(movie);
  }
}
