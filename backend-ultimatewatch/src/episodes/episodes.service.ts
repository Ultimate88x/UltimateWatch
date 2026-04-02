import { Injectable } from '@nestjs/common';
import { Episode } from './entities/episode.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EpisodeResponseDto } from './dto/episode-response-dto';
import { EpisodeDetailDto } from './dto/episode-detail-dto';
import { SeasonService } from 'src/seasons/seasons.service';
import { isDataStale } from 'src/common/helpers/data-stale.helper';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { TmdbSeasonDto } from 'src/common/tmdbapi/dto/media/tmdb-season-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { Season } from 'src/seasons/entities/seasons.entity';

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode)
    private readonly episodeRepository: Repository<Episode>,
    private readonly seasonService: SeasonService,
    private readonly tmdbApiService: TmdbApiService,
  ) {}

  async findFromSeasonByTmdbId(
    seasonTmdbId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<EpisodeResponseDto> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.episodeRepository.findAndCount({
      where: {
        season: { tmdbId: seasonTmdbId },
      },
      take: limit,
      skip: skip,
    });

    const isValid: boolean = data ? data.length > 0 : false;

    if (!isValid) {
      return EpisodeResponseDto.empty();
    }

    const episodeData = data.map((episode) =>
      this.createEpisodeDetailDto(episode),
    );

    return new EpisodeResponseDto({
      data: episodeData,
      total: total,
      page: page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async findOrCreate(
    seasonTmdbId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<EpisodeResponseDto> {
    const existingSeason: Season =
      await this.seasonService.findByTmdbId(seasonTmdbId);

    const ONE_HOUR = 1 / 24;
    const needsUpdate: boolean =
      !existingSeason.uniqueLastRetrieved ||
      isDataStale(existingSeason.uniqueLastRetrieved) ||
      (existingSeason.getEpisodeNumber() === 0 &&
        isDataStale(existingSeason.uniqueLastRetrieved, ONE_HOUR));

    if (needsUpdate) {
      const tmdbSeason: TmdbSeasonDto =
        await this.tmdbApiService.getSeasonFromTmdb(
          existingSeason.series.mediaContent.tmdbId,
          existingSeason.number,
        );

      const mappedSeason: Season =
        TmdbApiMapper.tmdbSeasonDtoToSeason(tmdbSeason);

      if (mappedSeason.episodes.length > 0) {
        mappedSeason.episodes.forEach((episode) => {
          episode.season = existingSeason;
        });

        await this.episodeRepository.upsert(mappedSeason.episodes, ['tmdbId']);
      }

      existingSeason.updatedAt = new Date();
      existingSeason.uniqueLastRetrieved = new Date();
      await this.seasonService.save(existingSeason);
    }

    return await this.findFromSeasonByTmdbId(seasonTmdbId, page, limit);
  }

  private createEpisodeDetailDto(episode: Episode): EpisodeDetailDto {
    return new EpisodeDetailDto({
      tmdbId: episode.tmdbId,
      title: episode.title,
      overview: episode.overview,
      imagePath: episode.imagePath,
      number: episode.number,
      releaseDate:
        episode.releaseDate && !(episode.releaseDate instanceof Date)
          ? new Date(episode.releaseDate).toISOString()
          : episode.releaseDate instanceof Date
            ? episode.releaseDate.toISOString()
            : null,
      runtime: episode.runtime,
      type: episode.type,
    });
  }
}
