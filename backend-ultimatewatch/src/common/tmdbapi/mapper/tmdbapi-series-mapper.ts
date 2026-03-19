import { TmdbListMediaDto } from '../dto/media/media-list-dto';
import {
  TmdbListMoviesResultDto,
  TmdbListResponseDto,
  TmdbListSeriesResultDto,
} from '../dto/media/tmdb-list-response-dto';

export class TmdbApiListMediaMapper {
  static tmdbListSeriesResultDtoToTmdbListMediaDto(
    response: TmdbListResponseDto<TmdbListSeriesResultDto>,
  ): TmdbListMediaDto[] {
    return response.results.map(
      (tmdbSeries: TmdbListSeriesResultDto): TmdbListMediaDto => ({
        id: tmdbSeries.id,
        title: tmdbSeries.name,
        posterPath: 'https://image.tmdb.org/t/p/w500' + tmdbSeries.poster_path,
        releaseDate: tmdbSeries.first_air_date,
      }),
    );
  }

  static tmdbListMoviesResultDtoToTmdbListMediaDto(
    response: TmdbListResponseDto<TmdbListMoviesResultDto>,
  ): TmdbListMediaDto[] {
    return response.results.map(
      (tmdbSeries: TmdbListMoviesResultDto): TmdbListMediaDto => ({
        id: tmdbSeries.id,
        title: tmdbSeries.title,
        posterPath: 'https://image.tmdb.org/t/p/w500' + tmdbSeries.poster_path,
        releaseDate: tmdbSeries.release_date,
      }),
    );
  }
}
