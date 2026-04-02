import { Injectable } from '@nestjs/common';
import { Genre } from './entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Repository } from 'typeorm';
import { TmdbGenreDto } from 'src/common/tmdbapi/dto/tmdb-genre-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { MediaType } from 'src/common/enums/media.type.enum';
import { GenreDetailDto } from './dto/genre-list-dto';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly tmdbApiService: TmdbApiService,
  ) {}

  async storeTmdbGenres(): Promise<number> {
    const [movieGenreDtoList, seriesGenreDtoList]: [
      TmdbGenreDto[],
      TmdbGenreDto[],
    ] = await Promise.all([
      this.tmdbApiService.getMediaGenres(MediaType.MOVIE),
      this.tmdbApiService.getMediaGenres(MediaType.SERIES),
    ]);

    const movieGenres: Genre[] = TmdbApiMapper.tmdbGenreDtoListToGenreList(
      movieGenreDtoList,
      MediaType.MOVIE,
    );

    const seriesGenres: Genre[] = TmdbApiMapper.tmdbGenreDtoListToGenreList(
      seriesGenreDtoList,
      MediaType.SERIES,
    );

    const allGenres = [...movieGenres, ...seriesGenres];

    if (allGenres.length > 0) {
      await this.genreRepository.upsert(allGenres, ['tmdbId', 'mediaType']);
    }

    return allGenres.length;
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

  async findForMovies(): Promise<GenreDetailDto[]> {
    const genres: Genre[] = await this.genreRepository.find({
      where: { mediaType: MediaType.MOVIE },
    });

    return genres.map((genre: Genre) => this.createGenreDetailDto(genre));
  }

  async findForSeries(): Promise<GenreDetailDto[]> {
    const genres: Genre[] = await this.genreRepository.find({
      where: { mediaType: MediaType.SERIES },
    });

    return genres.map((genre: Genre) => this.createGenreDetailDto(genre));
  }

  private createGenreDetailDto(genre: Genre): GenreDetailDto {
    return new GenreDetailDto({
      tmdbId: genre?.tmdbId,
      name: genre?.name,
    });
  }
}
