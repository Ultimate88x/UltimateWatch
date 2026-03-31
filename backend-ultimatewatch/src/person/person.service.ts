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
import { MediaCastResponseDto } from './dto/media-cast-response-dto';
import { MediaCrewResponseDto } from './dto/media-crew-response-dto';
import { isDataStale } from 'src/common/helpers/data-stale.helper';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';

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

  async findByTmdbId(tmdbId: number): Promise<Person | null> {
    const person = await this.personRepository.findOne({
      where: { tmdbId },
    });

    return person;
  }

  async findPeopleForMediaByTmdbId(
    mediaTmdbId: number,
  ): Promise<MediaPerson[]> {
    return await this.mediaPersonRepository.find({
      where: { mediaContent: { tmdbId: mediaTmdbId } },
      relations: ['person'],
    });
  }

  async findCastByTmdbId(
    mediaTmdbId: number,
    page: number = 1,
    limit: number = 6,
    mediaType: MediaType,
  ): Promise<MediaCastResponseDto> {
    await this.ensurePeopleAreLoaded(mediaTmdbId, mediaType);

    const skip = (page - 1) * limit;
    const [data, total] = await this.mediaPersonRepository.findAndCount({
      where: {
        mediaContent: { tmdbId: mediaTmdbId },
        type: PersonType.CAST,
      },
      relations: ['person'],
      take: limit,
      skip: skip,
    });

    const castData = data.map((mp) => this.createCastPersonDetailDto(mp));

    return new MediaCastResponseDto({
      data: castData,
      total: total,
      page: page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async findCrewByTmdbId(
    mediaTmdbId: number,
    page: number = 1,
    limit: number = 6,
    mediaType: MediaType,
  ): Promise<MediaCrewResponseDto> {
    await this.ensurePeopleAreLoaded(mediaTmdbId, mediaType);

    const skip = (page - 1) * limit;
    const [data, total] = await this.mediaPersonRepository.findAndCount({
      where: {
        mediaContent: { tmdbId: mediaTmdbId },
        type: PersonType.CREW,
      },
      relations: ['person'],
      take: limit,
      skip: skip,
    });

    const crewData = data.map((mp) => this.createCrewPersonDetailDto(mp));

    return new MediaCrewResponseDto({
      data: crewData,
      total: total,
      page: page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async findOrCreate(
    personTmdbId: number,
    mediaTmdbId: number,
    person: Person,
    peopleInfo: TmdbPeopleResponseDto,
  ): Promise<MediaCastDto | MediaCrewDto> {
    await this.personRepository.upsert(person, ['tmdbId']);
    const savedPerson: Person | null = await this.findByTmdbId(personTmdbId);

    const mediaContent: MediaContent | null =
      await this.mediaContentService.findByTmdbId(mediaTmdbId);

    const personInfo: TmdbCastDto | TmdbCrewDto | undefined =
      peopleInfo.cast.find((c) => c.id === personTmdbId) ||
      peopleInfo.crew.find((c) => c.id === personTmdbId);

    if (!savedPerson || !personInfo) {
      throw new ResourceNotFoundException(
        'Person',
        'TMDB_ID',
        personTmdbId.toString(),
      );
    }

    const mediaPersonEntity: MediaPerson =
      TmdbApiMapper.tmdbCastCrewDtoToMediaPerson(personInfo);

    await this.mediaPersonRepository.upsert(
      {
        type: mediaPersonEntity.type,
        character: mediaPersonEntity.character || 'N/A',
        job: mediaPersonEntity.job || 'N/A',
        person: savedPerson,
        mediaContent: mediaContent,
      },
      ['person', 'mediaContent', 'character', 'job'],
    );

    const finalMediaPerson = await this.mediaPersonRepository.findOne({
      where: {
        person: { id: savedPerson.id },
        mediaContent: { id: mediaContent.id },
        character: mediaPersonEntity.character || 'N/A',
        job: mediaPersonEntity.job || 'N/A',
      },
      relations: ['person'],
    });

    if (!finalMediaPerson) {
      throw new ResourceNotFoundException(
        'MediaPerson',
        'PERSON_ID, MEDIA_CONTENT_ID, CHARACTER/JOB',
        `${savedPerson.id}, ${mediaContent.id}, ${mediaPersonEntity.character || mediaPersonEntity.job}`,
      );
    }

    return finalMediaPerson?.type === PersonType.CAST
      ? this.createCastPersonDetailDto(finalMediaPerson)
      : this.createCrewPersonDetailDto(finalMediaPerson);
  }

  async ensurePeopleAreLoaded(
    mediaTmdbId: number,
    mediaType: MediaType,
  ): Promise<void> {
    const existingPeople = await this.findPeopleForMediaByTmdbId(mediaTmdbId);
    const isValid =
      existingPeople.length > 0 && !isDataStale(existingPeople[0].updatedAt);

    if (isValid) return;

    const peopleInfo = await this.tmdbapiService.getMediaPeople(
      mediaTmdbId,
      mediaType,
    );

    const people = TmdbApiMapper.tmdbPeopleResponseDtoToPersonList(peopleInfo);

    await Promise.all(
      people.map((p) =>
        this.findOrCreate(p.tmdbId, mediaTmdbId, p, peopleInfo),
      ),
    );
  }

  private createCastPersonDetailDto(mediaPerson: MediaPerson): MediaCastDto {
    return new MediaCastDto({
      name: mediaPerson.person.name,
      profilePath: mediaPerson.person.profilePath,
      character: mediaPerson.character,
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
