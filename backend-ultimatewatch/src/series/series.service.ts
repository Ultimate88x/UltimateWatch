import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { SeriesDetailDto } from './dto/series-detail-dto';
import { Series } from './entities/series.entity';
import { ProductionCompanyDto } from 'src/production-companies/dto/production-company-dto';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { TmdbSeriesDto } from 'src/common/tmdbapi/dto/media/tmdb-series-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { isDataStale } from 'src/common/helpers/data-stale.helper';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { Repository } from 'typeorm';
import { Season } from 'src/season/entities/season.entity';
import { SeasonService } from 'src/season/season.service';

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(Series)
    private readonly seriesRepository: Repository<Series>,
    private readonly tmdbApiService: TmdbApiService,
    private readonly genresService: GenresService,
    private readonly productionCompaniesService: ProductionCompaniesService,
    private readonly seasonService: SeasonService,
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

  async create(series: TmdbSeriesDto) {
    const mappedSeries: Series = TmdbApiMapper.tmdbSeriesDtoToSeries(series);

    mappedSeries.mediaContent.genres = await Promise.all(
      mappedSeries.mediaContent.genres.map((genre: Genre) =>
        this.genresService.findByTmdbId(genre.tmdbId),
      ),
    );

    mappedSeries.mediaContent.productionCompanies = await Promise.all(
      mappedSeries.mediaContent.productionCompanies.map(
        (productionCompany: ProductionCompany) =>
          this.productionCompaniesService.findOrCreate(
            productionCompany.tmdbId,
            productionCompany,
          ),
      ),
    );

    mappedSeries.seasons = await Promise.all(
      mappedSeries.seasons.map((season: Season) =>
        this.seasonService.create(season),
      ),
    );

    return await this.seriesRepository.save(mappedSeries);
  }

  async findSeriesFromTmdbId(tmdbId: number): Promise<SeriesDetailDto> {
    const existingSeries = await this.seriesRepository.findOne({
      where: {
        mediaContent: { tmdbId },
      },
      relations: [
        'mediaContent',
        'mediaContent.genres',
        'mediaContent.productionCompanies',
      ],
    });

    if (
      existingSeries &&
      !isDataStale(existingSeries?.mediaContent?.updatedAt)
    ) {
      return this.createSeriesDetailDto(existingSeries);
    }

    const series: TmdbSeriesDto =
      await this.tmdbApiService.getSeriesFromTmdb(tmdbId);

    try {
      const savedSeries = await this.create(series);
      return this.createSeriesDetailDto(savedSeries);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if ((error as { code: string }).code === '23505') {
          const existingSeries = await this.seriesRepository.findOne({
            where: { mediaContent: { tmdbId } },
            relations: [
              'mediaContent',
              'mediaContent.genres',
              'mediaContent.productionCompanies',
            ],
          });

          if (!existingSeries) {
            throw new ResourceNotFoundException(
              'Series',
              'TMEDB_ID',
              String(tmdbId),
            );
          }
          return this.createSeriesDetailDto(existingSeries);
        }
      }

      throw error;
    }
  }

  private createSeriesDetailDto(series: Series): SeriesDetailDto {
    return new SeriesDetailDto({
      tmdbId: series?.mediaContent?.tmdbId,
      title: series?.mediaContent?.title,
      overview: series?.mediaContent?.overview,
      imagePath: series?.mediaContent?.imagePath,
      status: series?.mediaContent?.status,
      genres: series?.mediaContent?.genres.map((genre) => genre.name),
      productionCompanies: series?.mediaContent?.productionCompanies.map(
        (company) =>
          new ProductionCompanyDto({
            name: company.name,
            logoPath: company.logoPath,
          }),
      ),
      releaseDate:
        series?.mediaContent?.releaseDate &&
        !(series?.mediaContent?.releaseDate instanceof Date)
          ? new Date(series?.mediaContent?.releaseDate).toISOString()
          : series?.mediaContent?.releaseDate instanceof Date
            ? series?.mediaContent?.releaseDate.toISOString()
            : null,
      lastAirDate:
        series?.lastAirDate && !(series?.lastAirDate instanceof Date)
          ? new Date(series?.lastAirDate).toISOString()
          : series?.lastAirDate instanceof Date
            ? series?.lastAirDate.toISOString()
            : null,
    });
  }
}
