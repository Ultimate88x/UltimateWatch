import { Injectable } from '@nestjs/common';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';

@Injectable()
export class SeriesService {
  constructor(private readonly tmdbApiService: TmdbApiService) {}

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

  async getSeriesListForWholePage(page: number = 1) {
    return this.fetchFourPages(page, (p) =>
      this.tmdbApiService.getSeriesListFromTmdb(p),
    );
  }

  async searchSeriesForWholePage(query: string, page: number = 1) {
    return this.fetchFourPages(page, (p) =>
      this.tmdbApiService.searchSeriesFromTmdb(query, p),
    );
  }
}
