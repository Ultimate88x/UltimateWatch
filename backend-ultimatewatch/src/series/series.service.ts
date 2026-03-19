import { Injectable } from '@nestjs/common';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/media-list-dto';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';

@Injectable()
export class SeriesService {
  constructor(private readonly tmdbApiService: TmdbApiService) {}

  async getSeriesListForWholePage(page: number = 1) {
    const finalList: TmdbListMediaDto[] = [];

    const startPage = (page - 1) * 4 + 1;
    for (let i = 0; i < 4; i++) {
      const newPage = startPage + i;
      const list: TmdbListMediaDto[] =
        await this.tmdbApiService.getSeriesListFromTmdb(newPage);

      finalList.push(...list);
    }

    return finalList;
  }
}
