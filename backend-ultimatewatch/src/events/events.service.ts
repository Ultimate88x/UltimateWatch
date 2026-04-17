import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Event } from './entities/event.entity';
import { LessThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Member } from 'src/members/entities/member.entity';
import { MediaService } from 'src/media/media.service';
import { Media } from 'src/media/entities/media.entity';
import { VotingEvent } from './entities/voting-event.entity';
import { CreateVotingEventDto } from './dto/create-voting-event-dto';
import { StandardEvent } from './entities/standard-event.entity';
import { CreateStandardEventDto } from './dto/create-standard-event-dto';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { EventStatus } from 'src/common/enums/event.status.enum';
import { ListEventDto } from './dto/list-event-dto';
import { ListEventResponseDto } from './dto/list-event-response-dto';
import { MemberRole } from 'src/common/enums/member.role.enum';
import { MembersService } from 'src/members/members.service';
import { MediaType } from 'src/common/enums/media.type.enum';
import { Season } from 'src/seasons/entities/seasons.entity';
import { SeasonService } from 'src/seasons/seasons.service';
import { EpisodeService } from 'src/episodes/episodes.service';
import { Episode } from 'src/episodes/entities/episode.entity';
import { EventDetailedInfoDto } from './dto/event-detailed-info-dto';
import { MediaEventDto } from './dto/media-event-dto';
import { SubMediaEventDto } from './dto/sub-media-event-dto';

interface SubMediaEventWithSort extends SubMediaEventDto {
  sortKey: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(StandardEvent)
    private readonly standardEventsRepository: Repository<StandardEvent>,
    @InjectRepository(VotingEvent)
    private readonly votingEventsRepository: Repository<VotingEvent>,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
    private readonly membersService: MembersService,
    private readonly seasonsService: SeasonService,
    private readonly episodesService: EpisodeService,
  ) {}

  async saveStandardEvent(
    standardEvent: StandardEvent,
  ): Promise<StandardEvent> {
    return await this.standardEventsRepository.save(standardEvent);
  }

  async saveVotingEvent(votingEvent: VotingEvent): Promise<VotingEvent> {
    return await this.votingEventsRepository.save(votingEvent);
  }

  async createStandardEvent(
    createEventDto: CreateStandardEventDto,
    userId: number,
  ): Promise<StandardEvent> {
    const { creator }: { creator: Member } =
      await this.mapEventCommonValues(userId);

    const mediaList: Media[] = await Promise.all(
      createEventDto.mediaIds.map(async (id: number) =>
        this.mediaService.findByTmdbId(id),
      ),
    );

    const event: StandardEvent = this.standardEventsRepository.create({
      ...createEventDto,
      members: [creator],
      media: mediaList,
      timer: 0,
      status: EventStatus.WAITING,
      visibility: '',
    });
    return await this.saveStandardEvent(event);
  }

  async createVotingEvent(
    createEventDto: CreateVotingEventDto,
    userId: number,
  ): Promise<VotingEvent> {
    const { creator }: { creator: Member } =
      await this.mapEventCommonValues(userId);

    const proposedMediaList: Media[] = await Promise.all(
      createEventDto.proposedMediaIds.map(async (id: number) =>
        this.mediaService.findByTmdbId(id),
      ),
    );

    const event: VotingEvent = this.votingEventsRepository.create({
      ...createEventDto,
      members: [creator],
      proposedMedia: proposedMediaList,
      timer: 0,
      status: EventStatus.VOTING,
      visibility: '',
    });
    return await this.saveVotingEvent(event);
  }

  async findBydId(id: number): Promise<Event> {
    const event: Event | null = await this.eventsRepository.findOne({
      where: { id },
      relations: {
        members: {
          user: true,
        },
        media: true,
      },
    });

    if (!event) {
      throw new ResourceNotFoundException('Event', 'ID', id.toString());
    }

    return event;
  }

  async findVotingEventBydId(id: number): Promise<VotingEvent> {
    const event: VotingEvent | null = await this.votingEventsRepository.findOne(
      {
        where: { id },
        relations: ['proposedMedia'],
      },
    );

    if (!event) {
      throw new ResourceNotFoundException('Voting Event', 'ID', id.toString());
    }

    return event;
  }

  async findExpiredAndVoting(): Promise<VotingEvent[]> {
    const events: VotingEvent[] = await this.votingEventsRepository.find({
      where: {
        status: EventStatus.VOTING,
        votingEndDate: LessThanOrEqual(new Date()),
      },
    });

    return events;
  }

  private async mapEventCommonValues(
    userId: number,
  ): Promise<{ creator: Member }> {
    const user: User = await this.usersService.findById(userId);

    const creator: Member = new Member();
    creator.user = user;
    creator.role = MemberRole.OWNER;

    return { creator };
  }

  async getEventsWithoutUser(
    userId: number,
    page: number = 1,
    limit: number = 12,
  ): Promise<ListEventResponseDto> {
    await this.usersService.findById(userId);

    const skip = (page - 1) * limit;

    const query = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect(
        'event.members',
        'ownerMember',
        'ownerMember.role = :ownerRole',
        { ownerRole: MemberRole.OWNER },
      )
      .leftJoinAndSelect('ownerMember.user', 'ownerUser')
      .leftJoinAndSelect('event.media', 'eventMedia')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('m.eventId')
          .from('members', 'm')
          .where('m.userId = :userId')
          .getQuery();
        return 'event.id NOT IN ' + subQuery;
      })
      .setParameter('userId', userId)
      .setParameter('ownerRole', MemberRole.OWNER)
      .andWhere('event.status != :finishedStatus', {
        finishedStatus: EventStatus.FINISHED,
      })
      .orderBy('event.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [events, total] = await query.getManyAndCount();

    const listEventDtos: ListEventDto[] = await Promise.all(
      events.map(async (event: Event) => this.createListEventDto(event)),
    );

    return new ListEventResponseDto({
      data: listEventDtos,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async getJoinedEventsByUser(
    userId: number,
    page: number = 1,
    limit: number = 12,
  ): Promise<ListEventResponseDto> {
    await this.usersService.findById(userId);

    const skip = (page - 1) * limit;

    const query = this.eventsRepository
      .createQueryBuilder('event')
      .innerJoin(
        'event.members',
        'memberFilter',
        'memberFilter.userId = :userId',
        { userId },
      )
      .leftJoinAndSelect(
        'event.members',
        'ownerMember',
        'ownerMember.role = :ownerRole',
        { ownerRole: MemberRole.OWNER },
      )
      .leftJoinAndSelect('ownerMember.user', 'ownerUser')
      .leftJoinAndSelect('event.media', 'eventMedia')
      .addSelect(
        `(CASE WHEN event.status = :finished THEN 1 ELSE 0 END)`,
        'is_finished',
      )
      .orderBy('is_finished', 'ASC')
      .addOrderBy('event.eventDate', 'DESC')
      .setParameter('userId', userId)
      .setParameter('ownerRole', MemberRole.OWNER)
      .setParameter('finished', EventStatus.FINISHED)
      .skip(skip)
      .take(limit);

    const [events, total] = await query.getManyAndCount();

    const listEventDtos: ListEventDto[] = await Promise.all(
      events.map(async (event: Event) => this.createListEventDto(event)),
    );

    return new ListEventResponseDto({
      data: listEventDtos,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async getCreatedEventsByUser(
    userId: number,
    page: number = 1,
    limit: number = 12,
  ): Promise<ListEventResponseDto> {
    await this.usersService.findById(userId);

    const skip = (page - 1) * limit;

    const query = this.eventsRepository
      .createQueryBuilder('event')
      .innerJoin(
        'event.members',
        'memberFilter',
        'memberFilter.userId = :userId AND memberFilter.role = :role',
        { userId, role: MemberRole.OWNER },
      )
      .leftJoinAndSelect(
        'event.members',
        'ownerMember',
        'ownerMember.role = :ownerRole',
        { ownerRole: MemberRole.OWNER },
      )
      .leftJoinAndSelect('ownerMember.user', 'ownerUser')
      .leftJoinAndSelect('event.media', 'eventMedia')
      .addSelect(
        `(CASE WHEN event.status = :finished THEN 1 ELSE 0 END)`,
        'is_finished',
      )
      .orderBy('is_finished', 'ASC')
      .addOrderBy('event.eventDate', 'DESC')
      .setParameter('userId', userId)
      .setParameter('ownerRole', MemberRole.OWNER)
      .setParameter('finished', EventStatus.FINISHED)
      .skip(skip)
      .take(limit);

    const [events, total] = await query.getManyAndCount();

    const listEventDtos: ListEventDto[] = await Promise.all(
      events.map(async (event: Event) => this.createListEventDto(event)),
    );

    return new ListEventResponseDto({
      data: listEventDtos,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async joinEvent(userId: number, eventId: number): Promise<void> {
    const existingMember: Member | null =
      await this.membersService.findByUserIdAndEventId(userId, eventId);

    if (existingMember) {
      throw new BadRequestException('You have already joined this event');
    }

    const user: User = await this.usersService.findById(userId);
    const event: Event = await this.findBydId(eventId);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException('You cannot join a finished event');
    }

    const currentMembers: number =
      await this.membersService.countFromEvent(eventId);

    if (currentMembers >= event.maxMembers) {
      throw new ForbiddenException(
        'This events has reached its limit of members',
      );
    }

    const member: Member = this.membersService.create(user, event);
    await this.membersService.save(member);
  }

  async leaveEvent(userId: number, eventId: number): Promise<void> {
    const existingMember: Member =
      await this.membersService.getByUserIdAndEventId(userId, eventId);

    if (existingMember.role === MemberRole.OWNER) {
      throw new BadRequestException(
        'As owner, you cannot leave the event. Either delete it or delegate it',
      );
    }

    await this.membersService.delete(existingMember.id);
  }

  async getEventDetailedInformation(
    eventId: number,
  ): Promise<EventDetailedInfoDto> {
    const event: Event = await this.findBydId(eventId);

    return new EventDetailedInfoDto({
      id: event.id,
      name: event.name,
      description: event.description,
      eventDate: event.eventDate,
      type: event.type,
      status: event.status,
      media: await this.createMediaEventDtoListForMediaList(event.media),
      maxMembers: event.maxMembers,
    });
  }

  private async createListEventDto(event: Event): Promise<ListEventDto> {
    const creator: Member = event.members[0];
    const mediaTitles: string | null = await this.formatMediaTitles(
      event.media,
    );
    const mainImagePath: string | null = await this.formatMainImagePath(
      event.media,
    );
    const currentMembers: number = await this.membersService.countFromEvent(
      event.id,
    );

    return new ListEventDto({
      id: event.id,
      name: event.name,
      eventDate: event.eventDate,
      type: event.type,
      status: event.status,
      creatorName: creator.user.username,
      creatorImagePath: creator.user.imagePath,
      mediaTitles: mediaTitles,
      mainImagePath: mainImagePath,
      currentMembers: currentMembers,
      maxMembers: event.maxMembers,
    });
  }

  private async createMediaEventDtoListForMediaList(
    mediaList: Media[] | null | undefined,
  ): Promise<MediaEventDto[] | null | undefined> {
    if (!mediaList) {
      return null;
    } else if (mediaList.length === 0) {
      return null;
    }

    const mediaEventDtoList: MediaEventDto[] = [];

    for (const media of mediaList) {
      let id: number;
      let title: string;
      let imagePath: string;
      let subMediaEvent: (SubMediaEventDto & { sortKey: string }) | null = null;

      switch (media.type) {
        case MediaType.SEASON: {
          const season = await this.seasonsService.findByTmdbId(media.tmdbId);
          id = season.series.tmdbId;
          title = season.series.title;
          imagePath = season.series.imagePath;
          subMediaEvent = Object.assign(
            new SubMediaEventDto({
              title: `S${season.number}: ${season.title}`,
              imagePath: season.imagePath,
            }),
            {
              sortKey: `S${season.number.toString().padStart(2, '0')}`,
            },
          );
          break;
        }

        case MediaType.EPISODE: {
          const episode = await this.episodesService.findByTmdbId(media.tmdbId);
          id = episode.season.series.tmdbId;
          title = episode.season.series.title;
          imagePath = episode.season.series.imagePath;
          subMediaEvent = Object.assign(
            new SubMediaEventDto({
              title: `S${episode.season.number}xE${episode.number}: ${episode.title}`,
              imagePath: media.imagePath,
            }),
            {
              sortKey: `S${episode.season.number.toString().padStart(2, '0')}xE${episode.number.toString().padStart(3, '0')}`,
            },
          );
          break;
        }

        case MediaType.SERIES:
        case MediaType.MOVIE:
          id = media.tmdbId;
          title = media.title;
          imagePath = media.imagePath;
          subMediaEvent = null;
          break;
      }

      const mediaEventDto = mediaEventDtoList.find((me) => me.id === id);

      if (mediaEventDto) {
        if (subMediaEvent) {
          if (!mediaEventDto.subMediaEvent) mediaEventDto.subMediaEvent = [];
          mediaEventDto.subMediaEvent.push(subMediaEvent);
        }
      } else {
        mediaEventDtoList.push(
          new MediaEventDto({
            id,
            title,
            imagePath,
            subMediaEvent: subMediaEvent ? [subMediaEvent] : null,
          }),
        );
      }
    }

    mediaEventDtoList.forEach((event) => {
      if (event.subMediaEvent && event.subMediaEvent.length > 1) {
        event.subMediaEvent.sort((a, b) => {
          const sortA = (a as SubMediaEventWithSort).sortKey;
          const sortB = (b as SubMediaEventWithSort).sortKey;
          return sortA.localeCompare(sortB);
        });
      }
    });

    return mediaEventDtoList;
  }

  private async formatMediaTitles(
    mediaList: Media[] | null | undefined,
  ): Promise<string | null> {
    if (!mediaList) {
      return null;
    } else if (mediaList.length === 0) {
      return null;
    }

    const detailedMedia = await Promise.all(
      mediaList.map(async (media) => {
        let formattedTitle = media.title;
        let sortKey = media.title;

        switch (media.type) {
          case MediaType.SEASON: {
            const season = await this.seasonsService.findByTmdbId(media.tmdbId);
            formattedTitle = `${season.series.title} S${season.number}: ${season.title}`;
            sortKey = `${season.series.title}-S${season.number.toString().padStart(2, '0')}`;
            break;
          }

          case MediaType.EPISODE: {
            const episode = await this.episodesService.findByTmdbId(
              media.tmdbId,
            );
            formattedTitle = `${episode.season.series.title} S${episode.season.number}xE${episode.number}: ${episode.title}`;
            sortKey = `${episode.season.series.title}-S${episode.season.number.toString().padStart(2, '0')}-E${episode.number.toString().padStart(3, '0')}`;
            break;
          }

          case MediaType.SERIES:
          case MediaType.MOVIE:
            sortKey = media.title;
            break;
        }

        return { formattedTitle, sortKey };
      }),
    );

    detailedMedia.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return detailedMedia.map((m) => m.formattedTitle).join(', ');
  }

  private async formatMainImagePath(
    mediaList: Media[] | null | undefined,
  ): Promise<string | null> {
    if (!mediaList) {
      return null;
    } else if (mediaList.length === 0) {
      return null;
    }

    const mainMedia: Media = mediaList[0];
    let imagePath: string;

    switch (mainMedia.type) {
      case MediaType.SEASON: {
        const season: Season = await this.seasonsService.findByTmdbId(
          mainMedia.tmdbId,
        );
        imagePath = season.series.imagePath;
        break;
      }

      case MediaType.EPISODE: {
        const episode: Episode = await this.episodesService.findByTmdbId(
          mainMedia.tmdbId,
        );
        imagePath = episode.season.series.imagePath;
        break;
      }

      case MediaType.SERIES:
      case MediaType.MOVIE:
        imagePath = mainMedia.imagePath;
        break;
    }

    return imagePath;
  }
}
