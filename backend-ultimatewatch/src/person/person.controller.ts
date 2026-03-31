import { Controller, Get, Param } from '@nestjs/common';
import { PersonService } from './person.service';
import { MediaPeopleResponseDto } from './dto/media-people-dto';
import { MediaType } from 'src/common/enums/media.type.enum';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Get('movie/:id')
  async getMovieByTmdbId(
    @Param('id') id: string,
  ): Promise<MediaPeopleResponseDto | null> {
    const people: MediaPeopleResponseDto | null =
      await this.personService.findPeopleOrGetFromTmdbAndFindOrCreate(
        +id,
        MediaType.MOVIE,
      );

    return people;
  }
}
