import { Injectable } from '@nestjs/common';
import { Season } from './entities/seasons.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeasonDetailDto } from './dto/season-detail-dto';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class SeasonService {
  constructor(
    @InjectRepository(Season)
    private readonly seasonRepository: Repository<Season>,
  ) {}

  async save(season: Season): Promise<Season> {
    return this.seasonRepository.save(season);
  }

  async findByTmdbId(tmdbId: number): Promise<Season> {
    const season = await this.seasonRepository.findOne({
      where: { tmdbId },
      relations: ['series.mediaContent'],
    });

    if (!season) {
      throw new ResourceNotFoundException(
        'Season',
        'TMDB_ID',
        tmdbId.toString(),
      );
    }

    return season;
  }

  async findSeasonDetailDtoBySeriesIdAndNumber(
    tmdbId: number,
    number: number,
  ): Promise<SeasonDetailDto> {
    const season = await this.seasonRepository.findOne({
      where: { series: { mediaContent: { tmdbId } }, number },
    });

    if (!season) {
      throw new ResourceNotFoundException(
        'Season',
        'SERIES_TMDB_ID & NUMBER',
        tmdbId.toString() + ', ' + number.toString(),
      );
    }

    return this.createSeasonDetailDto(season);
  }

  async upsert(season: Season): Promise<Season> {
    await this.seasonRepository.upsert(season, ['tmdbId']);

    return await this.findByTmdbId(season.tmdbId);
  }

  private createSeasonDetailDto(season: Season): SeasonDetailDto {
    return new SeasonDetailDto({
      tmdbId: season.tmdbId,
      title: season.title,
      overview: season.overview,
      imagePath: season.imagePath,
      number: season.number,
      releaseDate:
        season.releaseDate && !(season.releaseDate instanceof Date)
          ? new Date(season.releaseDate).toISOString()
          : season.releaseDate instanceof Date
            ? season.releaseDate.toISOString()
            : null,
    });
  }
}
