import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TmdbListMediaDto } from 'src/common/tmdbapi/dto/media/tmdb-media-list-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Movie } from './entities/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TmdbMovieDto } from 'src/common/tmdbapi/dto/media/tmdb-movie-dto';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { isDataStale } from 'src/common/helpers/data-stale.helper';
import { MovieDetailDto } from './dto/movie-detail-dto';
import { ProductionCompanyDto } from 'src/production-companies/dto/production-company-dto';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { MediaListDto } from 'src/common/dto/media-list-dto';
import { TmdbListMoviesResultDto } from 'src/common/tmdbapi/dto/media/tmdb-list-response-dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly tmdbApiService: TmdbApiService,
    private readonly genresService: GenresService,
    private readonly productionCompaniesService: ProductionCompaniesService,
    @Inject('CACHE_MANAGER')
    private readonly cacheManager: Cache,
  ) {}

  private readonly TMDB_MAX_PAGE = 500;

  private async fetchThreePages(
    page: number,
    fetchFn: (
      page: number,
    ) => Promise<{ mediaList: TmdbListMoviesResultDto[]; totalPages: number }>,
  ): Promise<MediaListDto> {
    const finalList: TmdbListMoviesResultDto[] = [];
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

    const movieList: TmdbListMediaDto[] =
      TmdbApiMapper.tmdbListMoviesResultDtoToTmdbListMediaDto(finalList);

    const filteredMedia: TmdbListMediaDto[] =
      TmdbApiMapper.filterDuplicateMedia(movieList);

    return new MediaListDto({
      mediaList: filteredMedia,
      lastPage: lastPage,
    });
  }

  async getMovieListForWholePage(
    page: number = 1,
    sort?: string,
    filters?: MediaFilterDto,
  ): Promise<MediaListDto> {
    const cacheKey = `movies_page_${page}_${sort}_${filters?.toString()}`;
    const cachedMediaList: MediaListDto | undefined =
      await this.cacheManager.get<MediaListDto>(cacheKey);

    if (cachedMediaList) return cachedMediaList;

    const movieList = await this.fetchThreePages(page, (p) =>
      this.tmdbApiService.getMovieListFromTmdb(p, sort, filters),
    );
    await this.cacheManager.set(cacheKey, movieList, 600000);
    return movieList;
  }

  async searchMoviesForWholePage(query: string, page: number = 1) {
    const cacheKey = `search_movies_${query}_page_${page}`;
    const cachedMediaList: MediaListDto | undefined =
      await this.cacheManager.get<MediaListDto>(cacheKey);

    if (cachedMediaList) return cachedMediaList;

    const movieList = await this.fetchThreePages(page, (p) =>
      this.tmdbApiService.searchMoviesFromTmdb(query, p),
    );
    await this.cacheManager.set(cacheKey, movieList, 600000);
    return movieList;
  }

  async create(movie: TmdbMovieDto) {
    const mappedMovie: Movie = TmdbApiMapper.tmdbMovieDtoToMovie(movie);

    mappedMovie.genres = await Promise.all(
      mappedMovie.genres.map((genre: Genre) =>
        this.genresService.findByTmdbId(genre.tmdbId),
      ),
    );

    mappedMovie.productionCompanies = await Promise.all(
      mappedMovie.productionCompanies.map(
        (productionCompany: ProductionCompany) =>
          this.productionCompaniesService.upsert(productionCompany),
      ),
    );

    return await this.movieRepository.save(mappedMovie);
  }

  async update(existingMovie: Movie, movie: TmdbMovieDto) {
    const mappedMovie: Movie = TmdbApiMapper.tmdbMovieDtoToMovie(movie);

    mappedMovie.genres = await Promise.all(
      mappedMovie.genres.map((genre: Genre) =>
        this.genresService.findByTmdbId(genre.tmdbId),
      ),
    );

    mappedMovie.productionCompanies = await Promise.all(
      mappedMovie.productionCompanies.map(
        (productionCompany: ProductionCompany) =>
          this.productionCompaniesService.upsert(productionCompany),
      ),
    );

    mappedMovie.updatedAt = new Date();

    this.movieRepository.merge(existingMovie, mappedMovie);
    return await this.movieRepository.save(existingMovie);
  }

  async findMovieFromTmdbId(tmdbId: number): Promise<MovieDetailDto> {
    const existingMovie = await this.movieRepository.findOne({
      where: { tmdbId },
      relations: ['genres', 'productionCompanies'],
    });

    if (existingMovie && !isDataStale(existingMovie.updatedAt)) {
      return this.createMovieDetailDto(existingMovie);
    }

    const tmdbMovie: TmdbMovieDto =
      await this.tmdbApiService.getMovieFromTmdb(tmdbId);

    let movieToReturn: Movie;

    if (!existingMovie) {
      movieToReturn = await this.create(tmdbMovie);
    } else {
      movieToReturn = await this.update(existingMovie, tmdbMovie);
    }

    return this.createMovieDetailDto(movieToReturn);
  }

  private createMovieDetailDto(movie: Movie): MovieDetailDto {
    return new MovieDetailDto({
      tmdbId: movie?.tmdbId,
      title: movie?.title,
      overview: movie?.overview,
      imagePath: movie?.imagePath,
      status: movie?.status,
      genres: movie?.genres.map((genre) => genre.name),
      productionCompanies: movie?.productionCompanies.map(
        (company) =>
          new ProductionCompanyDto({
            name: company.name,
            logoPath: company.logoPath,
          }),
      ),
      budget: movie?.budget,
      runtime: movie?.runtime,
      revenue: movie?.revenue,
      releaseDate:
        movie?.releaseDate && !(movie?.releaseDate instanceof Date)
          ? new Date(movie?.releaseDate).toISOString()
          : movie?.releaseDate instanceof Date
            ? movie?.releaseDate.toISOString()
            : null,
    });
  }
}
