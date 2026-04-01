import { Controller, Get, Param } from '@nestjs/common';
import { SeasonService } from './season.service';
import { SeasonDetailDto } from './dto/season-detail-dto';

@Controller('season')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get(':id')
  async getSeasonByTmdbId(@Param('id') id: string): Promise<SeasonDetailDto> {
    const season: SeasonDetailDto =
      await this.seasonService.findSeasonDetailDtoByTmdbId(+id);

    return season;
  }
}
