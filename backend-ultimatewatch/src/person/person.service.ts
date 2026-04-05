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
import { MediaService } from 'src/media/media.service';
import { MediaCastDto } from './dto/media-cast-dto';
import { MediaCrewDto } from './dto/media-crew-dto';
import { PersonType } from 'src/common/enums/person.type.enum';
import { MediaCastResponseDto } from './dto/media-cast-response-dto';
import { MediaCrewResponseDto } from './dto/media-crew-response-dto';
import { isDataStale } from 'src/common/helpers/data-stale.helper';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { Media } from 'src/media/entities/media.entity';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(MediaPerson)
    private readonly mediaPersonRepository: Repository<MediaPerson>,
    private readonly tmdbapiService: TmdbApiService,
    private readonly mediaService: MediaService,
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
      where: { media: { tmdbId: mediaTmdbId } },
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
        media: { tmdbId: mediaTmdbId },
        type: PersonType.CAST,
      },
      relations: ['person'],
      order: {
        order: 'ASC',
      },
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
    const query = this.mediaPersonRepository
      .createQueryBuilder('mp')
      .leftJoinAndSelect('mp.person', 'person')
      .leftJoin('mp.media', 'm')
      .addSelect(
        `CASE 
          WHEN mp.job LIKE '%Director%' THEN 1 
          WHEN mp.job LIKE '%Screenplay%' THEN 2 
          WHEN mp.job LIKE '%Writer%' THEN 3 
          WHEN mp.job LIKE '%Producer%' THEN 4 
          WHEN mp.job LIKE '%Executive Producer%' THEN 5
          WHEN mp.job LIKE '%Director of Photography%' THEN 6
          WHEN mp.job LIKE '%Original Music Composer%' THEN 7
          ELSE 99 END`,
        'priority',
      )
      .where('m.tmdbId = :tmdbId', { tmdbId: mediaTmdbId })
      .andWhere('mp.type = :type', { type: PersonType.CREW })
      .orderBy('priority', 'ASC')
      .addOrderBy('mp.id', 'ASC')
      .take(limit)
      .skip(skip);

    const [data, total] = await query.getManyAndCount();

    const crewData = data.map((mp) => this.createCrewPersonDetailDto(mp));

    const JOB_PRIORITY: Record<string, number> = {
      Director: 1,
      Screenplay: 2,
      Writer: 3,
      Producer: 4,
      'Executive Producer': 5,
      'Director of Photography': 6,
      'Original Music Composer': 7,
    };

    const sortedCrew = crewData.sort((a, b) => {
      const jobA = a.job.split(', ')[0];
      const jobB = b.job.split(', ')[0];

      const priorityA = JOB_PRIORITY[jobA] ?? 99;
      const priorityB = JOB_PRIORITY[jobB] ?? 99;

      return priorityA - priorityB;
    });

    return new MediaCrewResponseDto({
      data: sortedCrew,
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

    const media: Media | null =
      await this.mediaService.findByTmdbId(mediaTmdbId);

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
        order: mediaPersonEntity.order,
        episodeCount: mediaPersonEntity.episodeCount || 0,
        person: savedPerson,
        media: media,
      },
      ['person', 'media', 'character', 'job'],
    );

    const finalMediaPerson = await this.mediaPersonRepository.findOne({
      where: {
        person: { id: savedPerson.id },
        media: { id: media.id },
        character: mediaPersonEntity.character || 'N/A',
        job: mediaPersonEntity.job || 'N/A',
      },
      relations: ['person'],
    });

    if (!finalMediaPerson) {
      throw new ResourceNotFoundException(
        'MediaPerson',
        'PERSON_ID, MEDIA_ID, CHARACTER/JOB',
        `${savedPerson.id}, ${media.id}, ${mediaPersonEntity.character || mediaPersonEntity.job}`,
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

    const rawPeople = await this.tmdbapiService.getMediaPeople(
      mediaTmdbId,
      mediaType,
    );

    const peopleInfo = TmdbApiMapper.filterAndGroupCredits(rawPeople);
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
      episodeCount: mediaPerson.episodeCount,
    });
  }

  private createCrewPersonDetailDto(mediaPerson: MediaPerson): MediaCrewDto {
    return new MediaCrewDto({
      name: mediaPerson.person.name,
      profilePath: mediaPerson.person.profilePath,
      job: mediaPerson.job,
      episodeCount: mediaPerson.episodeCount,
    });
  }
}
