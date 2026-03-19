import { Injectable } from '@nestjs/common';
import { SeriesListDto } from 'src/common/tmdbapi/dto/series/series-list-dto';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';

@Injectable()
export class SeriesService {
  constructor(private readonly tmdbApiService: TmdbApiService) {}

  async getSeriesListForWholePage(page: number = 1) {
    const finalList: SeriesListDto[] = [];

    const startPage = (page - 1) * 4 + 1;
    for (let i = 0; i < 4; i++) {
      const newPage = startPage + i;
      const list: SeriesListDto[] =
        await this.tmdbApiService.getSeriesListFromTmdb(newPage);

      finalList.push(...list);
    }

    return finalList;
  }
}
