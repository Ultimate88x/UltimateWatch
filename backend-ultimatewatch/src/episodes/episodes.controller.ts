import { Controller, Get, Param, Query } from '@nestjs/common';
import { EpisodeService } from './episodes.service';
import { EpisodeResponseDto } from './dto/episode-response-dto';

@Controller('episodes')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Get('/season/:id')
  async getEpisodesBySeasonTmdbId(
    @Param('id') id: string,
    @Query('page') page: string = '1',
  ): Promise<EpisodeResponseDto> {
    const episodeResponse: EpisodeResponseDto =
      await this.episodeService.findOrCreate(+id, +page);

    return episodeResponse;
  }
}
