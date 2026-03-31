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
import { MediaCastResponseDto } from './dto/media-cast-response-dto';
import { MediaCrewResponseDto } from './dto/media-crew-response-dto';

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

  async findCastByTmdbId(
    mediaTmdbId: number,
    page: number = 1,
    limit: number = 6,
  ): Promise<{
    data: MediaPerson[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.mediaPersonRepository.findAndCount({
      where: { mediaContent: { tmdbId: mediaTmdbId }, type: PersonType.CAST },
      relations: ['person'],
      order: { order: 'ASC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findCrewByTmdbId(
    mediaTmdbId: number,
    page: number = 1,
    limit: number = 6,
  ): Promise<{
    data: MediaPerson[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.mediaPersonRepository.findAndCount({
      where: { mediaContent: { tmdbId: mediaTmdbId }, type: PersonType.CREW },
      relations: ['person'],
      order: { order: 'ASC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
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
    let castResult = await this.findCastByTmdbId(mediaTmdbId);
    let crewResult = await this.findCrewByTmdbId(mediaTmdbId);

    if (castResult.data.length === 0 || crewResult.data.length === 0) {
      const peopleInfo = await (mediaType === MediaType.MOVIE
        ? this.tmdbapiService.getMoviePeople(mediaTmdbId)
        : this.tmdbapiService.getMoviePeople(mediaTmdbId));

      if (!peopleInfo) return null;

      const people =
        TmdbApiMapper.tmdbPeopleResponseDtoToPersonList(peopleInfo);

      await Promise.all(
        people.map((p) =>
          this.findOrCreate(p.tmdbId, mediaTmdbId, p, peopleInfo),
        ),
      );

      castResult = await this.findCastByTmdbId(mediaTmdbId);
      crewResult = await this.findCrewByTmdbId(mediaTmdbId);
    }

    return {
      cast: this.mapToResponseDto(MediaCastResponseDto, castResult),
      crew: this.mapToResponseDto(MediaCrewResponseDto, crewResult),
    };
  }

  private mapToResponseDto<T>(
    ResponseClass: new (data: any) => T,
    result: {
      data: MediaPerson[];
      total: number;
      page: number;
      lastPage: number;
    },
  ): T {
    const dtoList = result.data.map((mp) => this.createPeopleDetailDto(mp));

    const listKey =
      ResponseClass.name === 'MediaCastResponseDto'
        ? 'mediaCastDtoList'
        : 'mediaCrewDtoList';

    return new ResponseClass({
      [listKey]: dtoList,
      total: result.total,
      page: result.page,
      lastPage: result.lastPage,
    });
  }

  private createPeopleDetailDto(
    mediaPerson: MediaPerson,
  ): MediaCastDto | MediaCrewDto {
    switch (mediaPerson.type) {
      case PersonType.CAST:
        return this.createCastPersonDetailDto(mediaPerson);
      case PersonType.CREW:
        return this.createCrewPersonDetailDto(mediaPerson);
      default:
        return this.createCastPersonDetailDto(mediaPerson);
    }
  }

  private createCastPersonDetailDto(mediaPerson: MediaPerson): MediaCastDto {
    return new MediaCastDto({
      name: mediaPerson.person.name,
      profilePath: mediaPerson.person.profilePath,
      character: mediaPerson.character,
      order: mediaPerson.order,
    });
  }

  private createCrewPersonDetailDto(mediaPerson: MediaPerson): MediaCrewDto {
    return new MediaCrewDto({
      name: mediaPerson.person.name,
      profilePath: mediaPerson.person.profilePath,
      job: mediaPerson.job,
    });
  }
}
