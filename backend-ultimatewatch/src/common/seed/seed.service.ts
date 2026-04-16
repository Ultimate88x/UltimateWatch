import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { Media } from 'src/media/entities/media.entity';
import { Person } from 'src/person/entities/person.entity';
import { SeriesService } from 'src/series/series.service';
import { EventsService } from 'src/events/events.service';
import { CreateVotingEventDto } from 'src/events/dto/create-voting-event-dto';
import { VotesService } from 'src/votes/votes.service';
import { CreateVoteDto } from 'src/votes/dto/create-vote.dto';
import { VotingEvent } from 'src/events/entities/voting-event.entity';
import { Member } from 'src/members/entities/member.entity';
import { MembersService } from 'src/members/members.service';
import { SeriesDetailDto } from 'src/series/dto/series-detail-dto';
import { MemberRole } from '../enums/member.role.enum';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(ProductionCompany)
    private readonly productionCompanyRepository: Repository<ProductionCompany>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Member)
    private readonly membersRepository: Repository<Member>,
    private readonly genreService: GenresService,
    private readonly seriesService: SeriesService,
    private readonly eventService: EventsService,
    private readonly memberService: MembersService,
    private readonly voteService: VotesService,
  ) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    this.logger.log('Deleting previous data...');

    await this.userRepository.query(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
    await this.mediaRepository.query(
      'TRUNCATE TABLE "media" RESTART IDENTITY CASCADE',
    );
    await this.productionCompanyRepository.query(
      'TRUNCATE TABLE "production_companies" RESTART IDENTITY CASCADE',
    );
    await this.providerRepository.query(
      'TRUNCATE TABLE "providers" RESTART IDENTITY CASCADE',
    );
    await this.personRepository.query(
      'TRUNCATE TABLE "people" RESTART IDENTITY CASCADE',
    );
    await this.eventRepository.query(
      'TRUNCATE TABLE "events" RESTART IDENTITY CASCADE',
    );

    this.logger.log('Data deleted succesfully!');

    this.logger.log('Seeding database...');

    const testAdmin: User = this.userRepository.create({
      id: 1,
      username: 'admin',
      email: 'admin@watch.com',
      password: await bcrypt.hash('123456', 10),
      imagePath: 'https://ui-avatars.com/api/?name=admin&background=random',
    });

    const testUser: User = this.userRepository.create({
      id: 2,
      username: 'user',
      email: 'user@watch.com',
      password: await bcrypt.hash('123456', 10),
      imagePath: 'https://ui-avatars.com/api/?name=user&background=random',
    });

    await this.userRepository.save(testAdmin);
    await this.userRepository.save(testUser);

    if ((await this.genreRepository.count()) === 0) {
      await this.genreService.storeTmdbGenres();
    }

    const aoT: SeriesDetailDto =
      await this.seriesService.findSeriesFromTmdbId(1429);
    await sleep(500);

    const edgerunners: SeriesDetailDto =
      await this.seriesService.findSeriesFromTmdbId(105248);
    await sleep(500);

    await this.seriesService.findSeriesFromTmdbId(114410);

    const votingEvent: CreateVotingEventDto = new CreateVotingEventDto({
      name: 'Votación: Mejor Anime',
      description: 'Elige qué serie veremos en el maratón del sábado.',
      eventDate: new Date(Date.now() + 600000),
      maxMedia: 1,
      maxVotesPerMember: 1,
      votingEndDate: new Date(Date.now() + 300000),
      proposedMediaIds: [1429, 105248, 114410],
    });

    const testVotingEvent: VotingEvent =
      await this.eventService.createVotingEvent(votingEvent, testAdmin.id);

    let userMember: Member = this.membersRepository.create({
      role: MemberRole.MEMBER,
      user: testUser,
      event: testVotingEvent,
    });

    const adminMember: Member = await this.memberService.findByUserIdAndEventId(
      testAdmin.id,
      testVotingEvent.id,
    );

    userMember = await this.membersRepository.save(userMember);

    const aoTVote: CreateVoteDto = new CreateVoteDto({
      eventId: testVotingEvent.id,
      mediaId: aoT.tmdbId,
    });

    const edgerunnersVote: CreateVoteDto = new CreateVoteDto({
      eventId: testVotingEvent.id,
      mediaId: edgerunners.tmdbId,
    });

    await this.voteService.createVote(edgerunnersVote, adminMember.id);
    await this.voteService.createVote(aoTVote, userMember.id);

    this.logger.log('Database seeded successfully!');
  }
}
