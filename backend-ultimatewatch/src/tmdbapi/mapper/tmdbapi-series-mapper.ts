import { SeriesListDto } from '../dto/series/series-list-dto';
import { SeriesListResponseDto } from '../dto/series/series-list-response-dto';

type TmdbSeriesResult = {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
};

export class TmdbApiSeriesMapper {
  static seriesListResponseDtoToSeriesListDto(
    response: SeriesListResponseDto,
  ): SeriesListDto[] {
    return response.results.map(
      (tmdbSeries: TmdbSeriesResult): SeriesListDto => ({
        tmdbId: tmdbSeries.id,
        name: tmdbSeries.name,
        posterPath: tmdbSeries.poster_path,
        firstAirDate: tmdbSeries.first_air_date,
      }),
    );
  }
}
