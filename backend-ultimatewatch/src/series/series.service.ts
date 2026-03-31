import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';

@Injectable()
export class SeriesService {
  constructor(
    private readonly tmdbApiService: TmdbApiService,
    @Inject('CACHE_MANAGER')
    private readonly cacheManager: Cache,
  ) {}

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

    return finalList.filter(
      (series, index, self) =>
        index === self.findIndex((s) => s.id === series.id),
    );
  }

  async getSeriesListForWholePage(page: number = 1) {
    const cacheKey = `series_page_${page}`;
    const cachedList: TmdbListMediaDto[] | undefined =
      await this.cacheManager.get<TmdbListMediaDto[]>(cacheKey);

    if (cachedList) return cachedList;

    const seriesList = await this.fetchFourPages(page, (p) =>
      this.tmdbApiService.getSeriesListFromTmdb(p),
    );

    await this.cacheManager.set(cacheKey, seriesList, 600000);
    return seriesList;
  }

  async searchSeriesForWholePage(query: string, page: number = 1) {
    const cacheKey = `search_series_${query}_page_${page}`;
    const cachedList: TmdbListMediaDto[] | undefined =
      await this.cacheManager.get<TmdbListMediaDto[]>(cacheKey);

    if (cachedList) return cachedList;

    const seriesList = await this.fetchFourPages(page, (p) =>
      this.tmdbApiService.searchSeriesFromTmdb(query, p),
    );

    await this.cacheManager.set(cacheKey, seriesList, 600000);
    return seriesList;
  }
}
