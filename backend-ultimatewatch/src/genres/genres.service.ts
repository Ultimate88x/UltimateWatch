import { Injectable } from '@nestjs/common';
import { Genre } from './entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Repository } from 'typeorm';
import { TmdbGenreDto } from 'src/common/tmdbapi/dto/media/tmdb-genre-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { MediaType } from './enums/media.type.enum';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly tmdbApiService: TmdbApiService,
  ) {}

  async storeTmdbGenres() {
    const genreDtoList: TmdbGenreDto[] =
      await this.tmdbApiService.getMovieGenres();

    const genreList: Genre[] = TmdbApiMapper.tmdbGenreDtoListToGenreList(
      genreDtoList,
      MediaType.MOVIE,
    );

    await this.genreRepository.save(genreList);
  }
}
