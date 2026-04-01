import { Controller, Get, Param } from '@nestjs/common';
import { EpisodeService } from './episode.service';
import { EpisodeResponseDto } from './dto/episode-response-dto';

@Controller('episode')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Get('/season/:id')
  async getSeasonByTmdbId(
    @Param('id') id: string,
  ): Promise<EpisodeResponseDto> {
    const episodeResponse: EpisodeResponseDto =
      await this.episodeService.findOrCreate(+id);

    return episodeResponse;
  }
}
