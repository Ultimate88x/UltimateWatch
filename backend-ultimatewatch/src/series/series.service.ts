import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { SeriesDetailDto } from './dto/series-detail-dto';
import { Series } from './entities/series.entity';
import { ProductionCompanyDto } from 'src/production-companies/dto/production-company-dto';
import { TmdbSeriesDto } from 'src/common/tmdbapi/dto/media/tmdb-series-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { isDataStale } from 'src/common/helpers/data-stale.helper';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { Repository } from 'typeorm';
import { SeasonService } from 'src/seasons/seasons.service';
import { SeasonListDto } from 'src/seasons/dto/season-list-dto';
import { Season } from 'src/seasons/entities/seasons.entity';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { TmdbListSeriesResultDto } from 'src/common/tmdbapi/dto/media/tmdb-list-response-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';

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

  private readonly TMDB_MAX_PAGE = 500;

  private async fetchThreePages(
    page: number,
    fetchFn: (
      page: number,
    ) => Promise<{ mediaList: TmdbListSeriesResultDto[]; totalPages: number }>,
  ): Promise<MediaListDto> {
    const finalList: TmdbListSeriesResultDto[] = [];
    let startPage = (page - 1) * 3 + 1;

    if (startPage + 2 > this.TMDB_MAX_PAGE) {
      startPage = this.TMDB_MAX_PAGE - 2;
    }

    startPage = Math.max(1, startPage);

    let lastPage: boolean = false;

    for (let i = 0; i < 3; i++) {
      const currentPage = startPage + i;

      if (currentPage >= this.TMDB_MAX_PAGE) {
        lastPage = true;
        break;
      }

      const { mediaList, totalPages } = await fetchFn(currentPage);

      if (mediaList && mediaList.length > 0) {
        finalList.push(...mediaList);
      }

      if (currentPage >= totalPages) {
        lastPage = true;
        break;
      }
    }

    const seriesList: TmdbListMediaDto[] =
      TmdbApiMapper.tmdbListSeriesResultDtoToTmdbListMediaDto(finalList);

    const filteredMedia: TmdbListMediaDto[] =
      TmdbApiMapper.filterDuplicateMedia(seriesList);

    return new MediaListDto({
      mediaList: filteredMedia,
      lastPage: lastPage,
    });
  }

  async getSeriesListForWholePage(
    page: number = 1,
    sort?: string,
    filters?: MediaFilterDto,
  ): Promise<MediaListDto> {
    const cacheKey = `series_page_${page}_${sort}_${filters?.toString()}`;
    const cachedMediaList: MediaListDto | undefined =
      await this.cacheManager.get<MediaListDto>(cacheKey);

    if (cachedMediaList) return cachedMediaList;

    const seriesList = await this.fetchThreePages(page, (p) =>
      this.tmdbApiService.getSeriesListFromTmdb(p, sort, filters),
    );
    await this.cacheManager.set(cacheKey, seriesList, 600000);
    return seriesList;
  }

  async searchSeriesForWholePage(query: string, page: number = 1) {
    const cacheKey = `search_series_${query}_page_${page}`;
    const cachedMediaList: MediaListDto | undefined =
      await this.cacheManager.get<MediaListDto>(cacheKey);

    if (cachedMediaList) return cachedMediaList;

    const seriesList = await this.fetchThreePages(page, (p) =>
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
          this.productionCompaniesService.upsert(productionCompany),
      ),
    );

    const savedSeries: Series = await this.seriesRepository.save(mappedSeries);

    mappedSeries.seasons = await Promise.all(
      savedSeries.seasons.map(async (season: Season) => {
        season.series = savedSeries;
        return await this.seasonService.upsert(season);
      }),
    );

    return await this.seriesRepository.save(savedSeries);
  }

  async update(existingSeries: Series, series: TmdbSeriesDto) {
    const mappedSeries: Series = TmdbApiMapper.tmdbSeriesDtoToSeries(series);
    mappedSeries.mediaContent.id = existingSeries.mediaContent.id;

    mappedSeries.mediaContent.genres = await Promise.all(
      mappedSeries.mediaContent.genres.map((genre: Genre) =>
        this.genresService.findByTmdbId(genre.tmdbId),
      ),
    );

    mappedSeries.mediaContent.productionCompanies = await Promise.all(
      mappedSeries.mediaContent.productionCompanies.map(
        (productionCompany: ProductionCompany) =>
          this.productionCompaniesService.upsert(productionCompany),
      ),
    );

    mappedSeries.seasons = await Promise.all(
      mappedSeries.seasons.map(async (season: Season) => {
        season.series = existingSeries;
        return await this.seasonService.upsert(season);
      }),
    );

    mappedSeries.mediaContent.updatedAt = new Date();
    mappedSeries.updatedAt = new Date();

    this.seriesRepository.merge(existingSeries, mappedSeries);
    return await this.seriesRepository.save(existingSeries);
  }

  async findSeriesFromTmdbId(tmdbId: number): Promise<SeriesDetailDto> {
    const existingSeries = await this.seriesRepository.findOne({
      where: { mediaContent: { tmdbId } },
      relations: [
        'mediaContent',
        'mediaContent.genres',
        'mediaContent.productionCompanies',
        'seasons',
      ],
    });

    if (existingSeries && !isDataStale(existingSeries.mediaContent.updatedAt)) {
      return this.createSeriesDetailDto(existingSeries);
    }

    const tmdbSeries: TmdbSeriesDto =
      await this.tmdbApiService.getSeriesFromTmdb(tmdbId);

    let seriesToReturn: Series;

    if (!existingSeries) {
      seriesToReturn = await this.create(tmdbSeries);
    } else {
      seriesToReturn = await this.update(existingSeries, tmdbSeries);
    }

    return this.createSeriesDetailDto(seriesToReturn);
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

      seasonsNumber: series.getSeasonsNumber(),
      seasonsInfo: series.seasons
        .sort((a, b) => a.number - b.number)
        .map(
          (season: Season) =>
            new SeasonListDto({
              title: season.title,
              number: season.number,
            }),
        ),
    });
  }
}
