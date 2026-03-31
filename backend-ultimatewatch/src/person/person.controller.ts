import { Controller, Get, Param, Query } from '@nestjs/common';
import { PersonService } from './person.service';
import { MediaCastResponseDto } from './dto/media-cast-response-dto';
import { MediaCrewResponseDto } from './dto/media-crew-response-dto';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get('cast/:tmdbId')
  async getCastForMediaByMediaTmdbId(
    @Param('tmdbId') tmdbId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
  ): Promise<MediaCastResponseDto | null> {
    const people: MediaCastResponseDto | null =
      await this.personService.findCastByTmdbId(+tmdbId, page, limit);

    return people;
  }

  @Get('crew/:tmdbId')
  async getCrewForMediaByMediaTmdbId(
    @Param('tmdbId') tmdbId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
  ): Promise<MediaCrewResponseDto | null> {
    const people: MediaCrewResponseDto | null =
      await this.personService.findCrewByTmdbId(+tmdbId, page, limit);

    return people;
  }
}
