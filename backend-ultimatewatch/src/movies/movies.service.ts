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

  private async fetchThreePages(
    page: number,
    fetchFn: (page: number) => Promise<TmdbListMediaDto[]>,
  ): Promise<TmdbListMediaDto[]> {
    const finalList: TmdbListMediaDto[] = [];
    const startPage = (page - 1) * 3 + 1;

    for (let i = 0; i < 3; i++) {
      const currentPage = startPage + i;
      const list = await fetchFn(currentPage);
      finalList.push(...list);
    }

    return finalList.filter(
      (movie, index, self) =>
        index === self.findIndex((m) => m.id === movie.id),
    );
  }

  async getMovieListForWholePage(
    page: number = 1,
    sort?: string,
    filters?: MediaFilterDto,
  ) {
    const cacheKey = `movies_page_${page}_${sort}_${filters?.toString()}`;
    const cachedList: TmdbListMediaDto[] | undefined =
      await this.cacheManager.get<TmdbListMediaDto[]>(cacheKey);

    if (cachedList) return cachedList;

    const movieList = await this.fetchThreePages(page, (p) =>
      this.tmdbApiService.getMovieListFromTmdb(p, sort, filters),
    );
    await this.cacheManager.set(cacheKey, movieList, 600000);
    return movieList;
  }

  async searchMoviesForWholePage(query: string, page: number = 1) {
    const cacheKey = `search_movies_${query}_page_${page}`;
    const cachedList: TmdbListMediaDto[] | undefined =
      await this.cacheManager.get<TmdbListMediaDto[]>(cacheKey);

    if (cachedList) return cachedList;

    const movieList = await this.fetchThreePages(page, (p) =>
      this.tmdbApiService.searchMoviesFromTmdb(query, p),
    );
    await this.cacheManager.set(cacheKey, movieList, 600000);
    return movieList;
  }

  async create(movie: TmdbMovieDto) {
    const mappedMovie: Movie = TmdbApiMapper.tmdbMovieDtoToMovie(movie);

    mappedMovie.mediaContent.genres = await Promise.all(
      mappedMovie.mediaContent.genres.map((genre: Genre) =>
        this.genresService.findByTmdbId(genre.tmdbId),
      ),
    );

    mappedMovie.mediaContent.productionCompanies = await Promise.all(
      mappedMovie.mediaContent.productionCompanies.map(
        (productionCompany: ProductionCompany) =>
          this.productionCompaniesService.upsert(productionCompany),
      ),
    );

    return await this.movieRepository.save(mappedMovie);
  }

  async update(existingMovie: Movie, movie: TmdbMovieDto) {
    const mappedMovie: Movie = TmdbApiMapper.tmdbMovieDtoToMovie(movie);
    mappedMovie.mediaContent.id = existingMovie.mediaContent.id;

    mappedMovie.mediaContent.genres = await Promise.all(
      mappedMovie.mediaContent.genres.map((genre: Genre) =>
        this.genresService.findByTmdbId(genre.tmdbId),
      ),
    );

    mappedMovie.mediaContent.productionCompanies = await Promise.all(
      mappedMovie.mediaContent.productionCompanies.map(
        (productionCompany: ProductionCompany) =>
          this.productionCompaniesService.upsert(productionCompany),
      ),
    );

    mappedMovie.mediaContent.updatedAt = new Date();
    mappedMovie.updatedAt = new Date();

    this.movieRepository.merge(existingMovie, mappedMovie);
    return await this.movieRepository.save(existingMovie);
  }

  async findMovieFromTmdbId(tmdbId: number): Promise<MovieDetailDto> {
    const existingMovie = await this.movieRepository.findOne({
      where: { mediaContent: { tmdbId } },
      relations: [
        'mediaContent',
        'mediaContent.genres',
        'mediaContent.productionCompanies',
      ],
    });

    if (existingMovie && !isDataStale(existingMovie.mediaContent.updatedAt)) {
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
      tmdbId: movie?.mediaContent?.tmdbId,
      title: movie?.mediaContent?.title,
      overview: movie?.mediaContent?.overview,
      imagePath: movie?.mediaContent?.imagePath,
      status: movie?.mediaContent?.status,
      genres: movie?.mediaContent?.genres.map((genre) => genre.name),
      productionCompanies: movie?.mediaContent?.productionCompanies.map(
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
        movie?.mediaContent?.releaseDate &&
        !(movie?.mediaContent?.releaseDate instanceof Date)
          ? new Date(movie?.mediaContent?.releaseDate).toISOString()
          : movie?.mediaContent?.releaseDate instanceof Date
            ? movie?.mediaContent?.releaseDate.toISOString()
            : null,
    });
  }
}
