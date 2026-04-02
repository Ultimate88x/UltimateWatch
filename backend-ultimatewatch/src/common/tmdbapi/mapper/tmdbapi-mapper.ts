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
  TmdbCastRoles,
  TmdbCrewDto,
  TmdbCrewJobs,
  TmdbPeopleResponseDto,
} from '../dto/tmdb-people-response-dto';
import { MediaPerson } from 'src/person/entities/media.person.entity';
import { PersonType } from 'src/common/enums/person.type.enum';
import { Series } from 'src/series/entities/series.entity';
import { TmdbSeriesDto } from '../dto/media/tmdb-series-dto';
import { TmdbSeasonDto } from '../dto/media/tmdb-season-dto';
import { TmdbEpisodeDto } from '../dto/media/tmdb-episode-dto';
import { Episode } from 'src/episodes/entities/episode.entity';
import { Season } from 'src/seasons/entities/seasons.entity';
import { MediaFilterDto } from 'src/common/dto/media-filter-dto';
import { TmdbParamsDto } from '../dto/tmdb-params-dto';

export class TmdbApiMapper {
  static tmdbListSeriesResultDtoToTmdbListMediaDto(
    response: TmdbListResponseDto<TmdbListSeriesResultDto>,
  ): TmdbListMediaDto[] {
    return response.results.map(
      (tmdbSeries: TmdbListSeriesResultDto): TmdbListMediaDto => ({
        id: tmdbSeries.id,
        title: tmdbSeries.name,
        posterPath: `https://image.tmdb.org/t/p/w500${tmdbSeries.poster_path}`,
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
        posterPath: `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`,
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
    mediaContent.imagePath = `https://image.tmdb.org/t/p/w500${response.poster_path}`;
    mediaContent.releaseDate =
      response.release_date && response.release_date.trim() !== ''
        ? new Date(response.release_date)
        : null;
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
    movie.mediaContent = mediaContent;

    return movie;
  }

  static tmdbSeriesDtoToSeries(response: TmdbSeriesDto): Series {
    const mediaContent = new MediaContent();
    const series = new Series();

    mediaContent.tmdbId = response.id;
    mediaContent.title = response.name;
    mediaContent.overview = response.overview;
    mediaContent.imagePath = `https://image.tmdb.org/t/p/w500${response.poster_path}`;
    mediaContent.releaseDate =
      response.first_air_date && response.first_air_date.trim() !== ''
        ? new Date(response.first_air_date)
        : null;
    mediaContent.status = response.status;
    mediaContent.type = MediaType.SERIES;
    mediaContent.genres = this.tmdbGenreDtoListToGenreList(
      response.genres,
      MediaType.SERIES,
    );
    mediaContent.productionCompanies =
      this.tmdbProductionCompanyDtoListToProductionCompanyList(
        response.production_companies,
      );

    series.lastAirDate =
      response.last_air_date && response.last_air_date.trim() !== ''
        ? new Date(response.last_air_date)
        : null;
    series.seasons = response.seasons
      ? this.tmdbSeasonDtoListToSeasonList(response.seasons)
      : [];
    series.mediaContent = mediaContent;

    return series;
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
    productionCompany.logoPath = `https://image.tmdb.org/t/p/original${response.logo_path}`;
    productionCompany.name = response.name;

    return productionCompany;
  }

  static tmdbProductionCompanyDtoListToProductionCompanyList(
    response: TmdbProductionCompanyDto[],
  ): ProductionCompany[] {
    return response.map(
      (tmdbProductionCompany: TmdbProductionCompanyDto): ProductionCompany =>
        this.tmdbProductionCompanyDtoToProductionCompany(tmdbProductionCompany),
    );
  }

  static tmdbProviderDtoListToProviderList(
    response: TmdbProviderDto[],
  ): Provider[] {
    return (response || []).map((tmdbProvider: TmdbProviderDto): Provider => {
      const provider: Provider = new Provider();

      provider.tmdbId = tmdbProvider.provider_id;
      provider.name = tmdbProvider.provider_name;
      provider.logoPath = `https://image.tmdb.org/t/p/original${tmdbProvider.logo_path}`;

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
      person.profilePath = `https://image.tmdb.org/t/p/w500${tmdbCast.profile_path}`;
      return person;
    });

    const crew: Person[] = response.crew.map((tmdbCrew: TmdbCrewDto) => {
      const person: Person = new Person();

      person.tmdbId = tmdbCrew.id;
      person.name = tmdbCrew.name;
      person.profilePath = `https://image.tmdb.org/t/p/w500${tmdbCrew.profile_path}`;
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

    const isCast = 'character' in tmdbPerson || 'roles' in tmdbPerson;
    mediaPerson.type = isCast ? PersonType.CAST : PersonType.CREW;

    if (isCast) {
      const cast = tmdbPerson;
      if (cast.roles && cast.roles.length > 0) {
        mediaPerson.character = cast.roles
          .map((r: TmdbCastRoles) => r.character || 'N/A')
          .join(', ');
      } else {
        mediaPerson.character = cast.character || 'N/A';
      }
      mediaPerson.job = 'N/A';
    } else {
      const crew = tmdbPerson as TmdbCrewDto;
      if (crew.jobs && crew.jobs.length > 0) {
        mediaPerson.job = crew.jobs
          .map((j: TmdbCrewJobs) => j.job || 'N/A')
          .join(', ');
      } else {
        mediaPerson.job = crew.job || 'N/A';
      }
      mediaPerson.character = 'N/A';
    }

    mediaPerson.order = 'order' in tmdbPerson ? tmdbPerson.order : undefined;
    mediaPerson.episodeCount = tmdbPerson.total_episode_count || 0;

    return mediaPerson;
  }

  static tmdbSeasonDtoToSeason(response: TmdbSeasonDto): Season {
    const season: Season = new Season();

    season.tmdbId = response.id;
    season.title = response.name;
    season.overview = response.overview;
    season.imagePath = `https://image.tmdb.org/t/p/w500${response.poster_path}`;
    season.releaseDate =
      response.air_date && response.air_date.trim() !== ''
        ? new Date(response.air_date)
        : null;
    season.number = response.season_number;
    season.episodes = response.episodes
      ? this.tmdbEpisodeDtoListToEpisodeList(response.episodes)
      : [];

    return season;
  }

  static tmdbSeasonDtoListToSeasonList(response: TmdbSeasonDto[]): Season[] {
    return response.map(
      (tmdbSeason: TmdbSeasonDto): Season =>
        this.tmdbSeasonDtoToSeason(tmdbSeason),
    );
  }

  static tmdbEpisodeDtoToEpisode(response: TmdbEpisodeDto): Episode {
    const episode: Episode = new Episode();

    episode.tmdbId = response.id;
    episode.title = response.name;
    episode.overview = response.overview;
    episode.imagePath = `https://image.tmdb.org/t/p/w500${response.still_path}`;
    episode.releaseDate =
      response.air_date && response.air_date.trim() !== ''
        ? new Date(response.air_date)
        : null;
    episode.number = response.episode_number;
    episode.runtime = response.runtime || 0;
    episode.type = response.episode_type;

    return episode;
  }

  static tmdbEpisodeDtoListToEpisodeList(
    response: TmdbEpisodeDto[],
  ): Episode[] {
    return response.map(
      (tmdbEpisode: TmdbEpisodeDto): Episode =>
        this.tmdbEpisodeDtoToEpisode(tmdbEpisode),
    );
  }

  static filterAndGroupCredits(
    peopleInfo: TmdbPeopleResponseDto,
  ): TmdbPeopleResponseDto {
    const SYNC_CONFIG = {
      MAX_CAST_ORDER: 40,
      RELEVANT_JOBS: [
        'Director',
        'Screenplay',
        'Writer',
        'Producer',
        'Executive Producer',
        'Director of Photography',
        'Original Music Composer',
      ],
    };

    const relevantCast = peopleInfo.cast.filter(
      (actor) => (actor.order ?? 99) <= SYNC_CONFIG.MAX_CAST_ORDER,
    );

    const crewMap = new Map<number, TmdbCrewDto>();

    peopleInfo.crew.forEach((member) => {
      const currentJobs: string[] = [];

      if (member.job && SYNC_CONFIG.RELEVANT_JOBS.includes(member.job)) {
        currentJobs.push(member.job);
      }

      if (member.jobs && member.jobs.length > 0) {
        member.jobs.forEach((j) => {
          if (j.job && SYNC_CONFIG.RELEVANT_JOBS.includes(j.job)) {
            currentJobs.push(j.job);
          }
        });
      }

      if (currentJobs.length === 0) return;

      const existing = crewMap.get(member.id);

      if (existing) {
        const allJobs = new Set([
          ...(existing.job?.split(', ') || []),
          ...currentJobs,
        ]);
        existing.job = Array.from(allJobs).join(', ');
      } else {
        crewMap.set(member.id, {
          ...member,
          job: currentJobs.join(', '),
        });
      }
    });

    return {
      ...peopleInfo,
      cast: relevantCast,
      crew: Array.from(crewMap.values()),
    };
  }

  static mapFiltersToTmdb = (filters: MediaFilterDto, mediaType: MediaType) => {
    const tmdbParams: Partial<TmdbParamsDto> = {};

    if (filters.withGenres) tmdbParams.with_genres = filters.withGenres;
    if (filters.withoutGenres)
      tmdbParams.without_genres = filters.withoutGenres;

    const dateGteKey =
      mediaType === MediaType.MOVIE
        ? 'primary_release_date.gte'
        : 'first_air_date.gte';
    const dateLteKey =
      mediaType === MediaType.MOVIE
        ? 'primary_release_date.lte'
        : 'first_air_date.lte';

    if (filters.releaseDateGreaterEqualThan) {
      tmdbParams[dateGteKey] = filters.releaseDateGreaterEqualThan
        .toISOString()
        .split('T')[0];
    }
    if (filters.releaseDateLowerEqualThan) {
      tmdbParams[dateLteKey] = filters.releaseDateLowerEqualThan
        .toISOString()
        .split('T')[0];
    }

    return tmdbParams;
  };
}
