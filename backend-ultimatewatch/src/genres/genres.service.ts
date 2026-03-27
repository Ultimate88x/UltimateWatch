import { Injectable } from '@nestjs/common';
import { Genre } from './entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Repository } from 'typeorm';
import { TmdbGenreDto } from 'src/common/tmdbapi/dto/tmdb-genre-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { MediaType } from '../common/tmdbapi/enums/media.type.enum';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly tmdbApiService: TmdbApiService,
  ) {}

  async storeTmdbGenres(): Promise<void> {
    const genreDtoList: TmdbGenreDto[] =
      await this.tmdbApiService.getMovieGenres();

    const genreList: Genre[] = TmdbApiMapper.tmdbGenreDtoListToGenreList(
      genreDtoList,
      MediaType.MOVIE,
    );

    await this.genreRepository.save(genreList);
  }

  async findByTmdbId(tmdbId: number): Promise<Genre> {
    const genre = await this.genreRepository.findOne({
      where: { tmdbId },
    });

    if (!genre) {
      throw new ResourceNotFoundException('Genre', 'TMDB_ID', String(tmdbId));
    }

    return genre;
  }
}
