import { Injectable } from '@nestjs/common';
import { Genre } from './entities/genre.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Repository } from 'typeorm';
import { TmdbGenreDto } from 'src/common/tmdbapi/dto/tmdb-genre-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { MediaType } from 'src/common/enums/media.type.enum';

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

    const rawGenres = [...movieGenres, ...seriesGenres];

    const uniqueGenresMap = new Map();
    rawGenres.forEach((genre) => {
      if (!uniqueGenresMap.has(genre.tmdbId)) {
        uniqueGenresMap.set(genre.tmdbId, genre);
      }
    });

    const finalGenres = Array.from(uniqueGenresMap.values());

    if (finalGenres.length > 0) {
      await this.genreRepository.upsert(finalGenres, ['tmdbId']);
    }

    return finalGenres.length;
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
