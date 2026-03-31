import { Injectable } from '@nestjs/common';
import { Person } from './entities/person.entity';
import { MediaPerson } from './entities/media.person.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { Repository } from 'typeorm';
import { MediaType } from 'src/common/enums/media.type.enum';
import {
  TmdbCastDto,
  TmdbCrewDto,
  TmdbPeopleResponseDto,
} from 'src/common/tmdbapi/dto/tmdb-people-response-dto';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { MediaContentsService } from 'src/media-contents/media-contents.service';
import { MediaCastDto } from './dto/media-cast-dto';
import { MediaCrewDto } from './dto/media-crew-dto';
import { PersonType } from 'src/common/enums/person.type.enum';
import { MediaPeopleResponseDto } from './dto/media-people-dto';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(MediaPerson)
    private readonly mediaPersonRepository: Repository<MediaPerson>,
    private readonly tmdbapiService: TmdbApiService,
    private readonly mediaContentService: MediaContentsService,
  ) {}

  async createPerson(person: Person): Promise<Person> {
    return await this.personRepository.save(person);
  }

  async createMediaPerson(mediaPerson: MediaPerson): Promise<MediaPerson> {
    return await this.mediaPersonRepository.save(mediaPerson);
  }

  async findByTmdbId(tmdbId: number): Promise<Person | null> {
    const person = await this.personRepository.findOne({
      where: { tmdbId },
    });

    return person;
  }

  async findMediaPeopleByTmdbId(mediaTmdbId: number): Promise<MediaPerson[]> {
    const mediaPeople = await this.mediaPersonRepository.find({
      where: { mediaContent: { tmdbId: mediaTmdbId } },
      relations: ['person'],
    });

    return mediaPeople;
  }

  async findOrCreate(
    personTmdbId: number,
    mediaTmdbId: number,
    person: Person,
    peopleInfo: TmdbPeopleResponseDto,
  ): Promise<MediaCastDto | MediaCrewDto> {
    let savedPerson = await this.findByTmdbId(personTmdbId);

    if (!savedPerson) {
      savedPerson = await this.createPerson(person);
    }

    const mediaContent =
      await this.mediaContentService.findByTmdbId(mediaTmdbId);

    const personInfo: TmdbCastDto | TmdbCrewDto | undefined =
      peopleInfo.cast.find((cast) => cast.id === person.tmdbId) ||
      peopleInfo.crew.find((crew) => crew.id === person.tmdbId);

    const mediaPerson = TmdbApiMapper.tmdbCastCrewDtoToMediaPerson(personInfo);
    mediaPerson.mediaContent = mediaContent;
    mediaPerson.person = savedPerson;

    await this.createMediaPerson(mediaPerson);

    const personDetailDto =
      mediaPerson.type === PersonType.CAST
        ? this.createCastPersonDetailDto(mediaPerson)
        : this.createCrewPersonDetailDto(mediaPerson);

    return personDetailDto;
  }

  async findPeopleOrGetFromTmdbAndFindOrCreate(
    mediaTmdbId: number,
    mediaType: MediaType,
  ): Promise<MediaPeopleResponseDto | null> {
    const mediaPeople: MediaPerson[] =
      await this.findMediaPeopleByTmdbId(mediaTmdbId);

    if (mediaPeople.length > 0) {
      const dtos = mediaPeople.map((mp) => this.createPeopleDetailDto(mp));

      return {
        cast: dtos.filter((p): p is MediaCastDto => p instanceof MediaCastDto),
        crew: dtos.filter((p): p is MediaCrewDto => p instanceof MediaCrewDto),
      };
    }

    let peopleInfo: TmdbPeopleResponseDto | undefined;

    switch (mediaType) {
      case MediaType.MOVIE:
        peopleInfo = await this.tmdbapiService.getMoviePeople(mediaTmdbId);
        break;

      default:
        peopleInfo = await this.tmdbapiService.getMoviePeople(mediaTmdbId);
        break;
    }

    if (!peopleInfo) {
      return null;
    }

    const people: Person[] =
      TmdbApiMapper.tmdbPeopleResponseDtoToPersonList(peopleInfo);

    const allPeople = await Promise.all(
      people.map((person) =>
        this.findOrCreate(person.tmdbId, mediaTmdbId, person, peopleInfo),
      ),
    );

    return {
      cast: allPeople.filter(
        (p): p is MediaCastDto => p instanceof MediaCastDto,
      ),
      crew: allPeople.filter(
        (p): p is MediaCrewDto => p instanceof MediaCrewDto,
      ),
    };
  }

  createPeopleDetailDto(mediaPerson: MediaPerson): MediaCastDto | MediaCrewDto {
    switch (mediaPerson.type) {
      case PersonType.CAST:
        return this.createCastPersonDetailDto(mediaPerson);
      case PersonType.CREW:
        return this.createCrewPersonDetailDto(mediaPerson);
      default:
        return this.createCastPersonDetailDto(mediaPerson);
    }
  }

  createCastPersonDetailDto(mediaPerson: MediaPerson): MediaCastDto {
    return new MediaCastDto({
      name: mediaPerson.person.name,
      profilePath: mediaPerson.person.profilePath,
      character: mediaPerson.character,
      order: mediaPerson.order,
    });
  }

  createCrewPersonDetailDto(mediaPerson: MediaPerson): MediaCrewDto {
    return new MediaCrewDto({
      name: mediaPerson.person.name,
      profilePath: mediaPerson.person.profilePath,
      job: mediaPerson.job,
    });
  }
}
