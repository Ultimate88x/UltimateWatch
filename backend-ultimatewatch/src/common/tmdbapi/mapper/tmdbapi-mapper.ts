import { TmdbListMediaDto } from '../dto/media/tmdb-media-list-dto';
import {
  TmdbListMoviesResultDto,
  TmdbListResponseDto,
  TmdbListSeriesResultDto,
} from '../dto/media/tmdb-list-response-dto';
import { TmdbMovieDto } from '../dto/media/tmdb-movie-dto';
import { Movie } from 'src/movies/entities/movie.entity';
import { Genre } from 'src/genres/entities/genre.entity';
import { TmdbGenreDto } from '../dto/tmdb-genre-dto';
import { TmdbProductionCompanyDto } from '../dto/tmdb-production-company-dto';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import {
  TmdbProviderDto,
  TmdbProviderInfoDto,
} from '../dto/tmdb-provider-response-dto';
import { Provider } from 'src/providers/entities/provider.entity';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';
import { MediaType } from 'src/common/enums/media.type.enum';
import { Person } from 'src/person/entities/person.entity';
import {
  TmdbCastDto,
  TmdbCrewDto,
  TmdbPeopleResponseDto,
} from '../dto/tmdb-people-response-dto';
import { MediaPerson } from 'src/person/entities/media.person.entity';
import { PersonType } from 'src/common/enums/person.type.enum';

export class TmdbApiMapper {
  static tmdbListSeriesResultDtoToTmdbListMediaDto(
    response: TmdbListResponseDto<TmdbListSeriesResultDto>,
  ): TmdbListMediaDto[] {
    return response.results.map(
      (tmdbSeries: TmdbListSeriesResultDto): TmdbListMediaDto => ({
        id: tmdbSeries.id,
        title: tmdbSeries.name,
        posterPath: `https://image.tmdb.org/t/p/w500/${tmdbSeries.poster_path}`,
        releaseDate: tmdbSeries.first_air_date,
      }),
    );
  }

  static tmdbListMoviesResultDtoToTmdbListMediaDto(
    response: TmdbListResponseDto<TmdbListMoviesResultDto>,
  ): TmdbListMediaDto[] {
    return response.results.map(
      (tmdbMovie: TmdbListMoviesResultDto): TmdbListMediaDto => ({
        id: tmdbMovie.id,
        title: tmdbMovie.title,
        posterPath: `https://image.tmdb.org/t/p/w500/${tmdbMovie.poster_path}`,
        releaseDate: tmdbMovie.release_date,
      }),
    );
  }

  static tmdbMovieDtoToMovie(response: TmdbMovieDto): Movie {
    const mediaContent = new MediaContent();
    const movie = new Movie();

    mediaContent.tmdbId = response.id;
    mediaContent.title = response.title;
    mediaContent.overview = response.overview;
    mediaContent.imagePath = `https://image.tmdb.org/t/p/w500/${response.poster_path}`;
    mediaContent.status = response.status;
    mediaContent.type = MediaType.MOVIE;
    mediaContent.genres = this.tmdbGenreDtoListToGenreList(
      response.genres,
      MediaType.MOVIE,
    );
    mediaContent.productionCompanies =
      this.tmdbProductionCompanyDtoListToProductionCompanyList(
        response.production_companies,
      );

    movie.budget = response.budget || 0;
    movie.runtime = response.runtime || 0;
    movie.revenue = response.revenue || 0;
    movie.releaseDate =
      response.release_date && response.release_date.trim() !== ''
        ? new Date(response.release_date)
        : null;
    movie.mediaContent = mediaContent;

    return movie;
  }

  static tmdbGenreDtoListToGenreList(
    response: TmdbGenreDto[],
    type: MediaType,
  ): Genre[] {
    return response.map((tmdbGenre: TmdbGenreDto): Genre => {
      const genre: Genre = new Genre();

      genre.tmdbId = tmdbGenre.id;
      genre.name = tmdbGenre.name;
      genre.mediaType = type;

      return genre;
    });
  }

  static tmdbProductionCompanyDtoToProductionCompany(
    response: TmdbProductionCompanyDto,
  ): ProductionCompany {
    const productionCompany: ProductionCompany = new ProductionCompany();

    productionCompany.tmdbId = response.id;
    productionCompany.logoPath = `https://image.tmdb.org/t/p/original/${response.logo_path}`;
    productionCompany.name = response.name;

    return productionCompany;
  }

  static tmdbProductionCompanyDtoListToProductionCompanyList(
    response: TmdbProductionCompanyDto[],
  ): ProductionCompany[] {
    return response.map(
      (tmdbProductionCompany: TmdbProductionCompanyDto): ProductionCompany => {
        const productionCompany: ProductionCompany = new ProductionCompany();

        productionCompany.tmdbId = tmdbProductionCompany.id;
        productionCompany.logoPath = `https://image.tmdb.org/t/p/original/${tmdbProductionCompany.logo_path}`;
        productionCompany.name = tmdbProductionCompany.name;

        return productionCompany;
      },
    );
  }

  static tmdbProviderDtoListToProviderList(
    response: TmdbProviderDto[],
  ): Provider[] {
    return (response || []).map((tmdbProvider: TmdbProviderDto): Provider => {
      const provider: Provider = new Provider();

      provider.tmdbId = tmdbProvider.provider_id;
      provider.name = tmdbProvider.provider_name;
      provider.logoPath = `https://image.tmdb.org/t/p/original/${tmdbProvider.logo_path}`;

      return provider;
    });
  }

  static tmdbProviderInfoDtoToProviderList(
    response: TmdbProviderInfoDto,
  ): Provider[] {
    if (!response) return [];

    const buyProviders: Provider[] = this.tmdbProviderDtoListToProviderList(
      response.buy || [],
    );
    const flatrateProviders: Provider[] =
      this.tmdbProviderDtoListToProviderList(response.flatrate || []);
    const rentProviders: Provider[] = this.tmdbProviderDtoListToProviderList(
      response.rent || [],
    );

    const providers: Provider[] = [
      ...new Map(
        [...buyProviders, ...flatrateProviders, ...rentProviders].map(
          (provider: Provider) => [provider.tmdbId, provider],
        ),
      ).values(),
    ];

    return providers;
  }

  static tmdbPeopleResponseDtoToPersonList(
    response: TmdbPeopleResponseDto,
  ): Person[] {
    const cast: Person[] = response.cast.map((tmdbCast: TmdbCastDto) => {
      const person: Person = new Person();

      person.tmdbId = tmdbCast.id;
      person.name = tmdbCast.name;
      person.profilePath = `https://image.tmdb.org/t/p/w500/${tmdbCast.profile_path}`;
      return person;
    });

    const crew: Person[] = response.crew.map((tmdbCrew: TmdbCrewDto) => {
      const person: Person = new Person();

      person.tmdbId = tmdbCrew.id;
      person.name = tmdbCrew.name;
      person.profilePath = `https://image.tmdb.org/t/p/w500/${tmdbCrew.profile_path}`;
      return person;
    });

    const people: Person[] = [
      ...new Map(
        [...cast, ...crew].map((person: Person) => [person.tmdbId, person]),
      ).values(),
    ];
    return people;
  }

  static tmdbCastCrewDtoToMediaPerson(
    tmdbPerson: TmdbCastDto | TmdbCrewDto,
  ): MediaPerson {
    const mediaPerson: MediaPerson = new MediaPerson();

    mediaPerson.type =
      'character' in tmdbPerson ? PersonType.CAST : PersonType.CREW;
    mediaPerson.character =
      'character' in tmdbPerson ? tmdbPerson.character : 'N/A';
    mediaPerson.job = 'job' in tmdbPerson ? tmdbPerson.job : 'N/A';

    return mediaPerson;
  }
}
