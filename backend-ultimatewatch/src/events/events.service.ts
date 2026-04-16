import { BadRequestException, Injectable } from '@nestjs/common';
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
    page: number,
    limit: number,
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

    const listEventDtos: ListEventDto[] = events.map((event: Event) =>
      this.createListEventDto(event),
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
    page: number,
    limit: number,
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

    const listEventDtos: ListEventDto[] = events.map((event: Event) =>
      this.createListEventDto(event),
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
    page: number,
    limit: number,
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

    const listEventDtos: ListEventDto[] = events.map((event: Event) =>
      this.createListEventDto(event),
    );

    return new ListEventResponseDto({
      data: listEventDtos,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    });
  }

  async joinEvent(userId: number, eventId: number): Promise<void> {
    const existingMember: Member =
      await this.membersService.findByUserIdAndEventId(userId, eventId);

    if (existingMember) {
      throw new BadRequestException('You have already joined this event');
    }

    const user: User = await this.usersService.findById(userId);
    const event: Event = await this.findBydId(eventId);

    if (event.status === EventStatus.FINISHED) {
      throw new BadRequestException('You cannot join a finished event');
    }

    const member: Member = this.membersService.create(user, event);
    await this.membersService.save(member);
  }

  private createListEventDto(event: Event): ListEventDto {
    const creator: Member = event.members[0];

    return new ListEventDto({
      name: event.name,
      description: event.description,
      eventDate: event.eventDate,
      type: event.type,
      status: event.status,
      creatorName: creator.user.username,
      creatorImagePath: creator.user.imagePath,
    });
  }
}
