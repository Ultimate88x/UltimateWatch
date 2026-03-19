import { TmdbListMediaDto } from '../dto/media/media-list-dto';
import { TmdbListResponseDto } from '../dto/media/tmdb-list-response-dto';

type TmdbSeriesResult = {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
};

export class TmdbApiListMediaMapper {
  static seriesListResponseDtoToSeriesListDto(
    response: TmdbListResponseDto,
  ): TmdbListMediaDto[] {
    return response.results.map(
      (tmdbSeries: TmdbSeriesResult): TmdbListMediaDto => ({
        id: tmdbSeries.id,
        title: tmdbSeries.name,
        posterPath: 'https://image.tmdb.org/t/p/w500' + tmdbSeries.poster_path,
        firstAirDate: tmdbSeries.first_air_date,
      }),
    );
  }
}
