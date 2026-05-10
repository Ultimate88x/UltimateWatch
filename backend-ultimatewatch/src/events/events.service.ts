import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Event } from './entities/event.entity';
import {
  Brackets,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
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
import { VoteResultDto } from 'src/votes/dto/vote-result.dto';
import { VotingMediaEventDto } from './dto/voting-media-event-dto';
import { VotingSubMediaEventDto } from './dto/voting-sub-media-event-dto';
import { EventType } from 'src/common/enums/event.type.enum';
import { VotingEventDetailedInfoDto } from './dto/voting-event-detailed-info-dto';
import { EventVisibility } from 'src/common/enums/event.visibility.enum';
import { RequestsService } from 'src/requests/requests.service';
import { CreateEventInviteRequestDto } from 'src/requests/dto/create-event-invite-request-dto';
import { FriendInviteItemDto } from './dto/friend-invite-item-dto';
import { FriendInviteResponseDto } from './dto/friend-invite-response-dto';
import { EventInviteRequest } from 'src/requests/entities/event-invite-request.entity';
import { EventAccessRequestDto } from 'src/requests/dto/event-access-request-dto';
import { RequestResponseDto } from 'src/requests/dto/request-response-dto';
import { Request } from 'src/requests/entities/request.entity';
import { EventAccessRequest } from 'src/requests/entities/event-access-request.entity';
import { UpdateStandardEventDto } from './dto/update-standard-event-dto';
import { UpdateVotingEventDto } from './dto/update-voting-event-dto';
import { v4 as uuidv4 } from 'uuid';
import { addWeeks, differenceInWeeks } from 'date-fns';
import { EventMediaService } from 'src/event-media/event-media.service';
import { EventMedia } from 'src/event-media/entities/event-media.entity';
import { EventMediaRoomDto } from './dto/event-media-room-dto';

interface SubMediaEventWithSort extends SubMediaEventDto {
  sortKey: string;
}

interface VotingSubMediaEventWithSort extends VotingSubMediaEventDto {
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
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
    private readonly eventMediaService: EventMediaService,
    private readonly membersService: MembersService,
    private readonly seasonsService: SeasonService,
    private readonly episodesService: EpisodeService,
    private readonly requestsService: RequestsService,
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
    recurringGroupId?: string,
  ): Promise<StandardEvent> {
    const { creator }: { creator: Member } =
      await this.mapEventCommonValues(userId);

    const mediaList: Media[] = await this.deleteMediaDuplicates(
      createEventDto.mediaIds,
    );

    const { isRecurring: _, weeks: __, ...eventData } = createEventDto;

    const event: StandardEvent = this.standardEventsRepository.create({
      ...eventData,
      recurringGroupId,
      members: [creator],
      timer: 0,
      status: EventStatus.WAITING,
    });
    const savedEvent: StandardEvent = await this.saveStandardEvent(event);

    if (mediaList && mediaList.length > 0) {
      await this.eventMediaService.createMany(savedEvent, mediaList);
    }

    savedEvent.createdAt = new Date(
      new Date(savedEvent.createdAt).setSeconds(0, 0),
    );

    return await this.saveStandardEvent(event);
  }

  async createVotingEvent(
    createEventDto: CreateVotingEventDto,
    userId: number,
    recurringGroupId?: string,
  ): Promise<VotingEvent> {
    const { creator }: { creator: Member } =
      await this.mapEventCommonValues(userId);

    const proposedMediaList: Media[] = await this.deleteMediaDuplicates(
      createEventDto.proposedMediaIds,
    );

    const { isRecurring: _, weeks: __, ...eventData } = createEventDto;

    const event: VotingEvent = this.votingEventsRepository.create({
      ...eventData,
      recurringGroupId,
      members: [creator],
      proposedMedia: proposedMediaList,
      timer: 0,
      status: EventStatus.VOTING,
    });

    const updatedEvent: VotingEvent = await this.saveVotingEvent(event);

    updatedEvent.createdAt = new Date(
      new Date(updatedEvent.createdAt).setSeconds(0, 0),
    );

    return await this.saveVotingEvent(event);
  }

  private async createRecurringInstances<
    T extends CreateStandardEventDto | CreateVotingEventDto,
  >(
    dto: T,
    userId: number,
    createSingleFn: (
      d: T,
      u: number,
      groupId?: string,
    ) => Promise<StandardEvent | VotingEvent>,
  ): Promise<(StandardEvent | VotingEvent)[]> {
    const instances: (StandardEvent | VotingEvent)[] = [];

    const shouldRepeat = dto.isRecurring && dto.weeks && dto.weeks > 1;
    const groupId = shouldRepeat ? uuidv4() : undefined;

    const iterations = shouldRepeat ? (dto.weeks as number) : 1;

    for (let i = 0; i < iterations; i++) {
      const instanceDto: T = { ...dto };

      instanceDto.eventDate = addWeeks(new Date(dto.eventDate), i);

      if ('votingEndDate' in dto && dto.votingEndDate instanceof Date) {
        (instanceDto as CreateVotingEventDto).votingEndDate = addWeeks(
          new Date(dto.votingEndDate),
          i,
        );
      }

      if (i > 0 && 'proposedMediaIds' in instanceDto) {
        instanceDto.proposedMediaIds = [];
      }

      if (i > 0 && 'mediaIds' in instanceDto) {
        instanceDto.mediaIds = [];
      }

      const event = await createSingleFn(instanceDto, userId, groupId);

      instances.push(event);
    }

    return instances;
  }

  async handleCreateStandardEvent(
    createEventDto: CreateStandardEventDto,
    userId: number,
  ): Promise<StandardEvent[]> {
    return (await this.createRecurringInstances(
      createEventDto,
      userId,
      (d, u, gid) => this.createStandardEvent(d, u, gid),
    )) as StandardEvent[];
  }

  async handleCreateVotingEvent(
    createEventDto: CreateVotingEventDto,
    userId: number,
  ): Promise<VotingEvent[]> {
    return (await this.createRecurringInstances(
      createEventDto,
      userId,
      (d, u, gid) => this.createVotingEvent(d, u, gid),
    )) as VotingEvent[];
  }

  async updateStandardEvent(
    userId: number,
    eventId: number,
    updateEventDto: UpdateStandardEventDto,
  ): Promise<StandardEvent> {
    const event: StandardEvent = await this.findStandardEventBydId(eventId);
    const eventOwner: Member =
      await this.membersService.getOwnerFromEvent(eventId);

    if (eventOwner.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permissions to update this event',
      );
    }

    if (event.status !== EventStatus.WAITING) {
      throw new BadRequestException('You can no longer update the event');
    }

    if (updateEventDto.maxMembers) {
      if (updateEventDto.maxMembers < event.members.length) {
        throw new BadRequestException(
          'You cannot set the maximum number of members to a value lower than the current amount of members',
        );
      }
    }

    if (updateEventDto.eventDate) {
      if (
        updateEventDto.eventDate < new Date(event.createdAt.getTime() + 600000)
      ) {
        throw new BadRequestException(
          'Event date must be at least ten minutes after creation',
        );
      }
    }

    const { updateAll: _, ...data } = updateEventDto;

    const updatedEvent: StandardEvent = this.standardEventsRepository.merge(
      event,
      data,
    );

    return await this.saveStandardEvent(updatedEvent);
  }

  async updateVotingEvent(
    userId: number,
    eventId: number,
    updateEventDto: UpdateVotingEventDto,
  ): Promise<VotingEvent> {
    const event: VotingEvent = await this.findVotingEventBydId(eventId);
    const eventOwner: Member =
      await this.membersService.getOwnerFromEvent(eventId);

    if (eventOwner.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permissions to update this event',
      );
    }

    if (
      event.status === EventStatus.STARTED ||
      event.status === EventStatus.FINISHED
    ) {
      throw new BadRequestException('You can no longer update the event');
    }

    if (updateEventDto.maxMembers) {
      if (updateEventDto.maxMembers < event.members.length) {
        throw new BadRequestException(
          'You cannot set the maximum number of members to a value lower than the current amount of members',
        );
      }
    }

    if (updateEventDto.eventDate) {
      if (
        updateEventDto.eventDate < new Date(event.createdAt.getTime() + 600000)
      ) {
        throw new BadRequestException(
          'Event date must be at least ten minutes after creation',
        );
      }
    }

    if (updateEventDto.votingEndDate) {
      if (
        updateEventDto.votingEndDate <
        new Date(event.createdAt.getTime() + 300000)
      ) {
        throw new BadRequestException(
          'Voting period must last at least five minutes',
        );
      }
    }

    if (updateEventDto.maxMedia) {
      if (event.status === EventStatus.WAITING) {
        updateEventDto.maxMedia = undefined;
      }
    }

    const { updateAll: _, ...data } = updateEventDto;

    const updatedEvent: VotingEvent = this.votingEventsRepository.merge(
      event,
      data,
    );

    return await this.saveVotingEvent(updatedEvent);
  }

  async handleUpdateStandardEvent(
    userId: number,
    eventId: number,
    updateDto: UpdateStandardEventDto,
  ): Promise<StandardEvent | StandardEvent[]> {
    const event = await this.findStandardEventBydId(eventId);

    if (updateDto.updateAll && event.recurringGroupId) {
      const futureEvents =
        await this.getFutureStandardEventsWithRecurringGroupId(
          event.recurringGroupId,
          event.eventDate,
        );

      return Promise.all(
        futureEvents.map((e) => {
          const instanceDto = { ...updateDto };

          if (updateDto.eventDate) {
            const weeksDiff = differenceInWeeks(
              new Date(e.eventDate),
              new Date(event.eventDate),
            );
            instanceDto.eventDate = addWeeks(
              new Date(updateDto.eventDate),
              weeksDiff,
            );
          }

          return this.updateStandardEvent(userId, e.id, instanceDto);
        }),
      );
    }

    return this.updateStandardEvent(userId, eventId, updateDto);
  }

  async handleUpdateVotingEvent(
    userId: number,
    eventId: number,
    updateDto: UpdateVotingEventDto,
  ): Promise<VotingEvent | VotingEvent[]> {
    const event = await this.findVotingEventBydId(eventId);

    if (updateDto.updateAll && event.recurringGroupId) {
      const futureEvents = await this.votingEventsRepository.find({
        where: {
          recurringGroupId: event.recurringGroupId,
          eventDate: MoreThanOrEqual(event.eventDate),
        },
      });

      return Promise.all(
        futureEvents.map((e) => {
          const instanceDto = { ...updateDto };

          if (updateDto.eventDate) {
            const weeksDiff = differenceInWeeks(
              new Date(e.eventDate),
              new Date(event.eventDate),
            );
            instanceDto.eventDate = addWeeks(
              new Date(updateDto.eventDate),
              weeksDiff,
            );
          }

          if (updateDto.votingEndDate) {
            const weeksDiff = differenceInWeeks(
              new Date(e.eventDate),
              new Date(event.eventDate),
            );
            instanceDto.votingEndDate = addWeeks(
              new Date(updateDto.votingEndDate),
              weeksDiff,
            );
          }

          return this.updateVotingEvent(userId, e.id, instanceDto);
        }),
      );
    }

    return this.updateVotingEvent(userId, eventId, updateDto);
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.eventsRepository.delete(eventId);
  }

  async cancelEvent(userId: number, eventId: number): Promise<void> {
    const eventOwner: Member =
      await this.membersService.getOwnerFromEvent(eventId);

    if (eventOwner.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permissions to delete this event',
      );
    }

    const event: Event = await this.findBydId(eventId);

    if (event.status === EventStatus.STARTED) {
      throw new BadRequestException('You cannot delete an ongoing event');
    }

    await this.deleteEvent(eventId);
  }

  async addMediaToStandardEvent(
    userId: number,
    eventId: number,
    mediaId: number,
  ): Promise<StandardEvent> {
    const event: StandardEvent = await this.findStandardEventBydId(eventId);
    const eventOwner: Member =
      await this.membersService.getOwnerFromEvent(eventId);

    if (eventOwner.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permissions to add media to this event',
      );
    }

    if (event.status !== EventStatus.WAITING) {
      throw new BadRequestException(
        'You can only add media to events in waiting status',
      );
    }

    if (event.media?.some((media) => media.media.tmdbId === mediaId)) {
      throw new BadRequestException('Media already in lineup');
    }

    if ((event.media?.length || 0) >= 20) {
      throw new BadRequestException(
        "You've reached the limit of media for an event (20)",
      );
    }

    const media: Media = await this.mediaService.findByTmdbId(mediaId);
    const eventMedia: EventMedia = await this.eventMediaService.create(
      event,
      media,
    );

    event.media = [...(event.media || []), eventMedia];

    return this.saveStandardEvent(event);
  }

  async deleteMediaFromEvent(
    userId: number,
    eventId: number,
    mediaId: number,
  ): Promise<void> {
    const event: Event = await this.findBydId(eventId);
    const eventOwner: Member =
      await this.membersService.getOwnerFromEvent(eventId);

    if (eventOwner.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permissions to delete media from this event',
      );
    }

    if (event.type === EventType.STANDARD) {
      await this.deleteMediaFromStandardEvent(userId, eventId, mediaId);
    } else {
      await this.deleteMediaFromVotingEvent(userId, eventId, mediaId);
    }
  }

  async deleteMediaFromStandardEvent(
    userId: number,
    eventId: number,
    mediaId: number,
  ): Promise<StandardEvent> {
    const event: StandardEvent = await this.findStandardEventBydId(eventId);

    if (event.status !== EventStatus.WAITING) {
      throw new BadRequestException(
        'You can only delete media from events in waiting status',
      );
    }

    if ((event.media?.length || 0) <= 1) {
      throw new BadRequestException(
        'An event must have a minimum of one media',
      );
    }

    const media: EventMedia | undefined = event.media?.find(
      (media) => media.media.tmdbId === mediaId,
    );

    if (!media) {
      throw new BadRequestException('Media not found in event');
    }

    event.media = event.media?.filter(
      (media: EventMedia) => media.media.tmdbId !== mediaId,
    );

    return this.saveStandardEvent(event);
  }

  async addProposedMediaToVotingEvent(
    eventId: number,
    mediaId: number,
  ): Promise<VotingEvent> {
    const event: VotingEvent = await this.findVotingEventBydId(eventId);

    if (event.status !== EventStatus.VOTING) {
      throw new BadRequestException(
        'You can only suggest media to events in voting status',
      );
    }

    if (event.proposedMedia.some((media) => media.tmdbId === mediaId)) {
      throw new BadRequestException('Media already in lineup');
    }

    if (event.proposedMedia.length >= 50) {
      throw new BadRequestException(
        'The maximum amount of proposed media has been reached (50)',
      );
    }

    const media: Media = await this.mediaService.findByTmdbId(mediaId);

    event.proposedMedia = [...event.proposedMedia, media];

    return this.saveVotingEvent(event);
  }

  async deleteMediaFromVotingEvent(
    userId: number,
    eventId: number,
    mediaId: number,
  ): Promise<StandardEvent> {
    const event: VotingEvent = await this.findVotingEventBydId(eventId);
    const eventOwner: Member =
      await this.membersService.getOwnerFromEvent(eventId);

    if (eventOwner.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permissions to delete media from this event',
      );
    }

    switch (event.status) {
      case EventStatus.WAITING:
        {
          if ((event.proposedMedia?.length || 0) <= 1) {
            throw new BadRequestException(
              'An event must have a minimum of one media',
            );
          }

          const media: EventMedia | undefined = event.media?.find(
            (media) => media.media.tmdbId === mediaId,
          );

          if (!media) {
            throw new BadRequestException('Media not found in event');
          }

          event.proposedMedia = event.proposedMedia.filter(
            (media: Media) => media.tmdbId !== mediaId,
          );

          await this.saveVotingEvent(event);

          event.media = [];
          const voteResults: VoteResultDto[] =
            await this.getResultsByEvent(eventId);

          for (const v of voteResults) {
            const media: Media = await this.mediaService.findByTmdbId(v.id);
            const eventMedia: EventMedia = await this.eventMediaService.create(
              event,
              media,
            );
            event.media.push(eventMedia);
          }
        }

        break;

      case EventStatus.VOTING:
        {
          if (event.proposedMedia.length <= 1) {
            throw new BadRequestException(
              'An event must have a minimum of one media',
            );
          }

          const media: Media | undefined = event.proposedMedia.find(
            (media) => media.tmdbId === mediaId,
          );

          if (!media) {
            throw new BadRequestException('Media not found in event');
          }

          event.proposedMedia = event.proposedMedia.filter(
            (media: Media) => media.tmdbId !== mediaId,
          );
        }

        break;

      case EventStatus.STARTED:
      case EventStatus.FINISHED:
        throw new BadRequestException(
          'You can only delete media from events in waiting status',
        );
    }

    return this.saveVotingEvent(event);
  }

  async findBydId(id: number): Promise<Event> {
    const event: Event | null = await this.eventsRepository.findOne({
      where: { id },
      relations: {
        members: {
          user: true,
        },
        media: {
          media: true,
        },
      },
    });

    if (!event) {
      throw new ResourceNotFoundException('Event', 'ID', id.toString());
    }

    return event;
  }

  async findStandardEventBydId(id: number): Promise<StandardEvent> {
    const event: StandardEvent | null =
      await this.standardEventsRepository.findOne({
        where: { id },
        relations: ['media', 'media.media', 'members'],
      });

    if (!event) {
      throw new ResourceNotFoundException(
        'Standard Event',
        'ID',
        id.toString(),
      );
    }

    return event;
  }

  async findVotingEventBydId(id: number): Promise<VotingEvent> {
    const event: VotingEvent | null = await this.votingEventsRepository.findOne(
      {
        where: { id },
        relations: ['media', 'media.media', 'proposedMedia', 'members'],
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
      .leftJoinAndSelect('eventMedia.media', 'actualMedia')
      .leftJoin(
        'request',
        'fr',
        `((fr.senderId = :userId AND fr.receiverId = ownerUser.id) OR 
          (fr.receiverId = :userId AND fr.senderId = ownerUser.id)) 
            AND fr.accepted = true 
            AND fr.type = :friendRequestType`,
        { userId, friendRequestType: 'friend_requests' },
      )
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('m.eventId')
          .from('members', 'm')
          .where('m.userId = :userId')
          .getQuery();
        return 'event.id NOT IN ' + subQuery;
      })
      .andWhere('event.status != :finishedStatus', {
        finishedStatus: EventStatus.FINISHED,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('event.visibility = :public', {
            public: EventVisibility.PUBLIC,
          })
            .orWhere('event.visibility = :request', {
              request: EventVisibility.REQUEST_ONLY,
            })
            .orWhere('(event.visibility = :friends AND fr.id IS NOT NULL)', {
              friends: EventVisibility.FRIENDS_ONLY,
            });
        }),
      )
      .setParameter('userId', userId)
      .setParameter('ownerRole', MemberRole.OWNER)
      .setParameter('friendRequestType', 'friend_requests')
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
      .leftJoinAndSelect('eventMedia.media', 'actualMedia')
      .addSelect(
        `(CASE WHEN event.status = :finished THEN 1 ELSE 0 END)`,
        'is_finished',
      )
      .orderBy('is_finished', 'ASC')
      .addOrderBy('event.eventDate', 'ASC')
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
      .leftJoinAndSelect('eventMedia.media', 'actualMedia')
      .addSelect(
        `(CASE WHEN event.status = :finished THEN 1 ELSE 0 END)`,
        'is_finished',
      )
      .orderBy('is_finished', 'ASC')
      .addOrderBy('event.eventDate', 'ASC')
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

  async getFutureStandardEventsWithRecurringGroupId(
    recurringGroupId: string,
    eventDate: Date,
  ): Promise<StandardEvent[]> {
    const futureEvents: StandardEvent[] =
      await this.standardEventsRepository.find({
        where: {
          recurringGroupId: recurringGroupId,
          eventDate: MoreThanOrEqual(eventDate),
        },
      });

    return futureEvents;
  }

  async getFutureVotingEventsWithRecurringGroupId(
    recurringGroupId: string,
    eventDate: Date,
  ): Promise<StandardEvent[]> {
    const futureEvents: VotingEvent[] = await this.votingEventsRepository.find({
      where: {
        recurringGroupId: recurringGroupId,
        eventDate: MoreThanOrEqual(eventDate),
      },
    });

    return futureEvents;
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

    const userCanJoinEvent: boolean = await this.checkCanSeeEvent(
      userId,
      eventId,
    );

    if (!userCanJoinEvent) {
      throw new ForbiddenException(
        'You do not have permission to join this event',
      );
    }

    const currentMembers: number =
      await this.membersService.countFromEvent(eventId);

    if (currentMembers >= event.maxMembers) {
      throw new ForbiddenException(
        'This event has reached its limit of members',
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

  async checkCanSeeEvent(userId: number, eventId: number): Promise<boolean> {
    const event: Event = await this.findBydId(eventId);
    const owner: Member | undefined = event.members.find(
      (m) => m.role === MemberRole.OWNER,
    );

    if (!owner) {
      throw new ResourceNotFoundException(
        'Event owner',
        'EVENT_ID',
        eventId.toString(),
      );
    }

    if (userId === owner.user.id) {
      return true;
    }

    switch (event.visibility) {
      case EventVisibility.FRIENDS_ONLY:
        return await this.requestsService.isFriendsWithUser(
          userId,
          owner.user.id,
        );

      case EventVisibility.PRIVATE: {
        const existsInvite: boolean =
          !!(await this.requestsService.findActiveEventInviteRequestBetweenUsers(
            owner.user.id,
            userId,
            eventId,
          ));

        const isMember: boolean = event.members.some(
          (member: Member) => member.user.id === userId,
        );

        return existsInvite || isMember;
      }

      case EventVisibility.REQUEST_ONLY:
      case EventVisibility.PUBLIC:
        return true;
    }
  }

  async getEventDetailedInformation(
    eventId: number,
  ): Promise<EventDetailedInfoDto | VotingEventDetailedInfoDto> {
    const event: Event = await this.findBydId(eventId);

    if (event.type === EventType.STANDARD) {
      return new EventDetailedInfoDto({
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        type: event.type,
        visibility: event.visibility,
        status: event.status,
        maxMembers: event.maxMembers,
        isRecurring: !!event.recurringGroupId,
      });
    } else {
      const votingEvent = event as VotingEvent;

      return new VotingEventDetailedInfoDto({
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        type: event.type,
        visibility: event.visibility,
        status: event.status,
        maxMembers: event.maxMembers,
        maxMedia: votingEvent.maxMedia,
        maxVotesPerMember: votingEvent.maxVotesPerMember,
        votingEndDate: votingEvent.votingEndDate,
        isRecurring: !!event.recurringGroupId,
      });
    }
  }

  async getMediasEventFromEvent(
    eventId: number,
  ): Promise<MediaEventDto[] | VotingMediaEventDto[]> {
    const event: Event = await this.findBydId(eventId);

    if (event.type === EventType.STANDARD) {
      return (
        (await this.createMediaEventDtoListForMediaList(event.media)) || []
      );
    } else {
      const votingResults: VoteResultDto[] = await this.getResultsByEvent(
        eventId,
        event.status !== EventStatus.VOTING,
      );

      return event.status === EventStatus.VOTING
        ? (await this.createVotingMediaEventDtoListForProposedMediaList(
            votingResults,
          )) || []
        : (await this.createMediaEventDtoListForMediaList(event.media)) || [];
    }
  }

  async getEventMediaForEventRoom(
    eventId: number,
  ): Promise<EventMediaRoomDto[]> {
    const event: Event = await this.findBydId(eventId);

    const sortedMedia = [...event.media].sort((a, b) => a.order - b.order);

    return await Promise.all(
      sortedMedia.map(async (eventMedia: EventMedia) => {
        const formattedTitle = await this.formatSingleMediaTitle(
          eventMedia.media.tmdbId,
          eventMedia.media.title,
          eventMedia.media.type,
        );

        return new EventMediaRoomDto({
          id: eventMedia.id,
          tmdbId: eventMedia.media.tmdbId,
          title: formattedTitle,
          imagePath: eventMedia.media.imagePath,
          type: eventMedia.media.type,
          status: eventMedia.status,
          watchedAt: eventMedia.watchedAt,
          order: eventMedia.order,
        });
      }),
    );
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
      visibility: event.visibility,
      status: event.status,
      creatorName: creator.user.username,
      creatorImagePath: creator.user.imagePath,
      mediaTitles: mediaTitles,
      mainImagePath: mainImagePath,
      currentMembers: currentMembers,
      maxMembers: event.maxMembers,
    });
  }

  async getResultsByEvent(
    eventId: number,
    limited: boolean = true,
  ): Promise<VoteResultDto[]> {
    const event: VotingEvent = await this.findVotingEventBydId(eventId);

    const query = this.mediaRepository
      .createQueryBuilder('media')
      .innerJoin('media.proposedInEvents', 'event')
      .leftJoin('media.votes', 'vote')
      .leftJoin('vote.member', 'member', 'member.event.id = :eventId', {
        eventId: Number(eventId),
      })
      .select([
        'media.tmdbId AS "id"',
        'media.title AS "title"',
        'media.imagePath AS "imagePath"',
        'media.type AS "type"',
        'COUNT(member.id) AS "count"',
        'MAX(vote.createdAt) AS "lastVoteDate"',
      ])
      .where('event.id = :eventId', { eventId: Number(eventId) })
      .groupBy('media.id')
      .addGroupBy('media.tmdbId')
      .addGroupBy('media.title')
      .addGroupBy('media.imagePath')
      .addGroupBy('media.type')
      .orderBy('count', 'DESC')
      .addOrderBy('MAX(vote.createdAt)', 'ASC')
      .addOrderBy('media.tmdbId', 'ASC');

    if (limited) {
      query.limit(event.maxMedia);
    }

    const results = await query.getRawMany();

    return results.map((row: VoteResultDto) => ({
      id: Number(row.id),
      title: row.title,
      imagePath: row.imagePath,
      type: row.type,
      count: Number(row.count),
    }));
  }

  async inviteUserToEvent(
    userId: number,
    createEventInviteRequestDto: CreateEventInviteRequestDto,
  ): Promise<void> {
    const { receiverId, eventId } = createEventInviteRequestDto;

    const event: Event = await this.findBydId(eventId);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException(
        'You cannot invite users to a finished event',
      );
    }

    const currentMembers: number =
      await this.membersService.countFromEvent(eventId);

    if (currentMembers >= event.maxMembers) {
      throw new ForbiddenException(
        'This event has reached its limit of members',
      );
    }

    await this.membersService.getByUserIdAndEventId(userId, eventId);

    const receiverIsMemberOfEvent: boolean =
      !!(await this.membersService.findByUserIdAndEventId(receiverId, eventId));

    if (receiverIsMemberOfEvent) {
      throw new BadRequestException(
        'The user is already a member of the event',
      );
    }

    await this.requestsService.createEventInviteRequest(
      userId,
      createEventInviteRequestDto,
    );
  }

  async resolveEventInviteRequest(
    userId: number,
    id: number,
    accept: boolean,
  ): Promise<boolean> {
    const request: EventInviteRequest =
      await this.requestsService.findEventInviteRequestById(id);

    if (request.receiver.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to resolve this request',
      );
    }

    if (accept) {
      const requests: Request[] =
        await this.requestsService.findEventRequestsFromUser(
          userId,
          request.event.id,
        );

      await Promise.all(
        requests.map((request: Request) =>
          this.requestsService.resolveRequest(request, accept),
        ),
      );

      await this.joinEvent(userId, request.event.id);
    } else {
      await this.requestsService.resolveRequest(request, accept);
    }

    return accept;
  }

  async resolveEventAccessRequest(
    userId: number,
    id: number,
    accept: boolean,
  ): Promise<boolean> {
    const request: EventAccessRequest =
      await this.requestsService.findEventAccessRequestById(id);

    const eventOwner: Member = await this.membersService.getOwnerFromEvent(
      request.event.id,
    );
    const isEventOwner: boolean = eventOwner?.user.id === userId;

    if (!isEventOwner) {
      throw new ForbiddenException(
        'You are not authorized to resolve this request',
      );
    }

    if (accept) {
      await this.joinEvent(request.sender.id, request.event.id);
    }

    return await this.requestsService.resolveRequest(request, accept);
  }

  async getFriendsToInvite(
    userId: number,
    eventId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<FriendInviteResponseDto> {
    const skip = (page - 1) * limit;

    const query = this.usersRepository
      .createQueryBuilder('user')
      .innerJoin(
        'request',
        'friendship',
        `((friendship.senderId = :userId AND friendship.receiverId = user.id) OR 
        (friendship.receiverId = :userId AND friendship.senderId = user.id)) 
      AND friendship.accepted = true 
      AND friendship.type = :friendType`,
        { userId, friendType: 'friend_requests' },
      )
      .leftJoin(
        'members',
        'member',
        'member.userId = user.id AND member.eventId = :eventId',
        { eventId },
      )
      .leftJoin(
        'request',
        'invite',
        `invite.receiverId = user.id 
      AND invite.senderId = :userId
      AND invite.eventId = :eventId 
      AND invite.type = :inviteType
      AND invite.accepted = false`,
        { eventId, inviteType: 'event_invite_requests' },
      )
      .where('member.id IS NULL')
      .andWhere('user.id != :userId');

    const total = await query.getCount();

    const data: FriendInviteItemDto[] = await query
      .select([
        'user.id AS id',
        'user.username AS username',
        'user.imagePath AS "imagePath"',
        'invite.id IS NOT NULL AS "hasPendingInvite"',
      ])
      .orderBy('user.username', 'ASC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async requestAccessToEvent(userId: number, eventId: number): Promise<void> {
    const event: Event = await this.findBydId(eventId);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException(
        'You cannot request access to a finished event',
      );
    }

    const currentMembers: number =
      await this.membersService.countFromEvent(eventId);

    if (currentMembers >= event.maxMembers) {
      throw new ForbiddenException(
        'This event has reached its limit of members',
      );
    }

    const receiverIsMemberOfEvent: boolean =
      !!(await this.membersService.findByUserIdAndEventId(userId, eventId));

    if (receiverIsMemberOfEvent) {
      throw new BadRequestException('You are already a member of the event');
    }

    await this.requestsService.createEventAccessRequest(userId, eventId);
  }

  async getActiveAccessRequestsFromEvent(
    userId: number,
    eventId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<RequestResponseDto<EventAccessRequestDto>> {
    const event: Event = await this.findBydId(eventId);

    const owner: Member | undefined = event.members.find(
      (m) => m.role === MemberRole.OWNER,
    );

    if (userId !== owner?.user.id) {
      throw new ForbiddenException(
        'You cannot retrieve access requests from this event',
      );
    }

    return this.requestsService.findActiveEventAccessRequestsFromEvent(
      eventId,
      page,
      limit,
    );
  }

  async getFormattedResultsByEvent(
    eventId: number,
    limited: boolean = true,
  ): Promise<VoteResultDto[]> {
    const results: VoteResultDto[] = await this.getResultsByEvent(
      eventId,
      limited,
    );

    return Promise.all(
      results.map(async (row: VoteResultDto) => ({
        id: Number(row.id),
        title: await this.formatSingleMediaTitle(row.id, row.title, row.type),
        imagePath: row.imagePath,
        type: row.type,
        count: Number(row.count),
      })),
    );
  }

  async updateTimer(id: number, seconds: number) {
    return await this.eventsRepository.update(id, { timer: seconds });
  }

  private async getConflictiveIds(
    mediaId: number,
    currentIds: Set<number>,
  ): Promise<number[]> {
    const idsToRemove: number[] = [];

    const episode = await this.episodesService.findByTmdbId(mediaId);
    if (episode) {
      const seasonId = episode.season.tmdbId;
      const seriesId = episode.season.series.tmdbId;

      if (currentIds.has(seasonId)) idsToRemove.push(mediaId);
      if (currentIds.has(seriesId)) idsToRemove.push(mediaId);
      return idsToRemove;
    }

    const season = await this.seasonsService.findByTmdbId(mediaId);
    if (season) {
      const seriesId = season.series.tmdbId;

      if (currentIds.has(seriesId)) idsToRemove.push(mediaId);
      return idsToRemove;
    }

    return idsToRemove;
  }

  private async deleteMediaDuplicates(mediaList: number[]): Promise<Media[]> {
    const idSet = new Set(mediaList);
    const idsToDelete = new Set<number>();

    await Promise.all(
      mediaList.map(async (mediaId) => {
        const conflicts = await this.getConflictiveIds(mediaId, idSet);
        conflicts.forEach((id) => idsToDelete.add(id));
      }),
    );

    const cleanIds = mediaList.filter((id) => !idsToDelete.has(id));

    return Promise.all(
      cleanIds.map((id) => this.mediaService.findByTmdbId(id)),
    );
  }

  private async createMediaEventDtoListForMediaList(
    mediaList: EventMedia[] | undefined,
  ): Promise<MediaEventDto[] | null> {
    if (!mediaList) {
      return null;
    } else if (mediaList.length === 0) {
      return null;
    }

    const mediaEventDtoList: MediaEventDto[] = [];

    for (const eventMedia of mediaList) {
      let id: number;
      let title: string;
      let imagePath: string;
      let subMediaEvent: (SubMediaEventDto & { sortKey: string }) | null = null;

      const media: Media = eventMedia.media;

      switch (media.type) {
        case MediaType.SEASON: {
          const season = await this.seasonsService.getByTmdbId(media.tmdbId);
          id = season.series.tmdbId;
          title = season.series.title;
          imagePath = season.series.imagePath;
          subMediaEvent = Object.assign(
            new SubMediaEventDto({
              id: season.tmdbId,
              title: `S${season.number}: ${season.title}`,
              imagePath: season.imagePath,
              type: media.type,
            }),
            {
              sortKey: `S${season.number.toString().padStart(2, '0')}`,
            },
          );
          break;
        }

        case MediaType.EPISODE: {
          const episode = await this.episodesService.getByTmdbId(media.tmdbId);
          id = episode.season.series.tmdbId;
          title = episode.season.series.title;
          imagePath = episode.season.series.imagePath;
          subMediaEvent = Object.assign(
            new SubMediaEventDto({
              id: episode.tmdbId,
              title: `S${episode.season.number}xE${episode.number}: ${episode.title}`,
              imagePath: media.imagePath,
              type: media.type,
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
            type:
              media.type === MediaType.MOVIE
                ? MediaType.MOVIE
                : MediaType.SERIES,
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

  private async createVotingMediaEventDtoListForProposedMediaList(
    voteResults: VoteResultDto[],
  ): Promise<VotingMediaEventDto[]> {
    const mediaEventDtoList: VotingMediaEventDto[] = [];

    for (const voteResult of voteResults) {
      let id: number;
      let title: string;
      let imagePath: string;
      let subMediaEvent: (VotingSubMediaEventDto & { sortKey: string }) | null =
        null;
      let count: number | null | undefined;
      let isVotable: boolean = false;

      switch (voteResult.type) {
        case MediaType.SEASON: {
          const season = await this.seasonsService.getByTmdbId(voteResult.id);
          id = season.series.tmdbId;
          title = season.series.title;
          imagePath = season.series.imagePath;
          subMediaEvent = Object.assign(
            new VotingSubMediaEventDto({
              id: season.tmdbId,
              title: `S${season.number}: ${season.title}`,
              imagePath: season.imagePath,
              type: voteResult.type,
              count: voteResult.count,
            }),
            {
              sortKey: `S${season.number.toString().padStart(2, '0')}`,
            },
          );
          break;
        }

        case MediaType.EPISODE: {
          const episode = await this.episodesService.getByTmdbId(voteResult.id);
          id = episode.season.series.tmdbId;
          title = episode.season.series.title;
          imagePath = episode.season.series.imagePath;
          subMediaEvent = Object.assign(
            new VotingSubMediaEventDto({
              id: episode.tmdbId,
              title: `S${episode.season.number}xE${episode.number}: ${episode.title}`,
              imagePath: voteResult.imagePath,
              type: voteResult.type,
              count: voteResult.count,
            }),
            {
              sortKey: `S${episode.season.number.toString().padStart(2, '0')}xE${episode.number.toString().padStart(3, '0')}`,
            },
          );
          break;
        }

        case MediaType.SERIES:
        case MediaType.MOVIE:
          id = voteResult.id;
          title = voteResult.title;
          imagePath = voteResult.imagePath;
          subMediaEvent = null;
          count = voteResult.count;
          isVotable = true;
          break;
      }

      const mediaEventDto = mediaEventDtoList.find((me) => me.id === id);

      if (mediaEventDto) {
        if (subMediaEvent) {
          if (!mediaEventDto.subMediaEvent) mediaEventDto.subMediaEvent = [];
          mediaEventDto.subMediaEvent.push(subMediaEvent);
        }
        if (isVotable) mediaEventDto.isVotable = isVotable;
      } else {
        mediaEventDtoList.push(
          new VotingMediaEventDto({
            id,
            title,
            imagePath,
            type:
              voteResult.type === MediaType.MOVIE
                ? MediaType.MOVIE
                : MediaType.SERIES,
            subMediaEvent: subMediaEvent ? [subMediaEvent] : null,
            count,
            isVotable,
          }),
        );
      }
    }

    mediaEventDtoList.forEach((event) => {
      if (event.subMediaEvent && event.subMediaEvent.length > 1) {
        event.subMediaEvent.sort((a, b) => {
          const sortA = (a as VotingSubMediaEventWithSort).sortKey;
          const sortB = (b as VotingSubMediaEventWithSort).sortKey;
          return sortA.localeCompare(sortB);
        });
      }
    });

    return mediaEventDtoList;
  }

  private async formatMediaTitles(
    mediaList: EventMedia[] | null | undefined,
  ): Promise<string | null> {
    if (!mediaList) {
      return null;
    } else if (mediaList.length === 0) {
      return null;
    }

    const detailedMedia = await Promise.all(
      mediaList.map(async (eventMedia: EventMedia) => {
        const media: Media = eventMedia.media;

        let formattedTitle = media.title;
        let sortKey = media.title;

        switch (media.type) {
          case MediaType.SEASON: {
            const season = await this.seasonsService.getByTmdbId(media.tmdbId);
            formattedTitle = `${season.series.title} S${season.number}: ${season.title}`;
            sortKey = `${season.series.title}-S${season.number.toString().padStart(2, '0')}`;
            break;
          }

          case MediaType.EPISODE: {
            const episode = await this.episodesService.getByTmdbId(
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
    mediaList: EventMedia[] | null | undefined,
  ): Promise<string | null> {
    if (!mediaList) {
      return null;
    } else if (mediaList.length === 0) {
      return null;
    }

    const eventMedia: EventMedia = mediaList[0];
    const mainMedia: Media = eventMedia.media;
    let imagePath: string;

    switch (mainMedia.type) {
      case MediaType.SEASON: {
        const season: Season = await this.seasonsService.getByTmdbId(
          mainMedia.tmdbId,
        );
        imagePath = season.series.imagePath;
        break;
      }

      case MediaType.EPISODE: {
        const episode: Episode = await this.episodesService.getByTmdbId(
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

  private async formatSingleMediaTitle(
    id: number,
    title: string,
    type: MediaType,
  ): Promise<string> {
    switch (type) {
      case MediaType.SEASON: {
        const season = await this.seasonsService.getByTmdbId(id);
        return `${season.series.title} S${season.number}: ${season.title}`;
      }

      case MediaType.EPISODE: {
        const episode = await this.episodesService.getByTmdbId(id);
        return `${episode.season.series.title} S${episode.season.number}xE${episode.number}: ${episode.title}`;
      }

      case MediaType.SERIES:
      case MediaType.MOVIE:
      default:
        return title;
    }
  }
}
