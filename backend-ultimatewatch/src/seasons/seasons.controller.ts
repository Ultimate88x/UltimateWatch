import { Controller, Get, Param } from '@nestjs/common';
import { SeasonService } from './seasons.service';
import { SeasonDetailDto } from './dto/season-detail-dto';

@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get('/series/:id/:number')
  async getSeasonByTmdbId(
    @Param('id') id: string,
    @Param('number') number: string,
  ): Promise<SeasonDetailDto> {
    const season: SeasonDetailDto =
      await this.seasonService.findSeasonDetailDtoBySeriesIdAndNumber(
        +id,
        +number,
      );

    return season;
  }
}
