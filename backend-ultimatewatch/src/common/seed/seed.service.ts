/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../users/entities/user.entity';
import { Genre } from 'src/genres/entities/genre.entity';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { Media } from 'src/media/entities/media.entity';
import { Person } from 'src/person/entities/person.entity';
import { VotingEvent } from 'src/events/entities/voting-event.entity';
import { Member } from 'src/members/entities/member.entity';
import { Event } from 'src/events/entities/event.entity';
import { FriendRequest } from 'src/requests/entities/friend-request.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Comment } from 'src/comments/entities/comment.entity';

import { EventVisibility } from '../enums/event.visibility.enum';
import { CreateVotingEventDto } from 'src/events/dto/create-voting-event-dto';
import { CreateStandardEventDto } from 'src/events/dto/create-standard-event-dto';
import { CreateVoteDto } from 'src/votes/dto/create-vote.dto';
import { CreateEventInviteRequestDto } from 'src/requests/dto/create-event-invite-request-dto';

import { GenresService } from 'src/genres/genres.service';
import { SeriesService } from 'src/series/series.service';
import { MoviesService } from 'src/movies/movies.service';
import { EventsService } from 'src/events/events.service';
import { MembersService } from 'src/members/members.service';
import { VotesService } from 'src/votes/votes.service';
import { RequestsService } from 'src/requests/requests.service';
import { CommentsService } from 'src/comments/comments.service';
import { CreateCommentDto } from 'src/comments/dto/create-comment-dto';
import { ResultsService } from 'src/results/results.service';
import { EventMedia } from 'src/event-media/entities/event-media.entity';
import { EventMetric } from 'src/event-metrics/entities/event-metric.entity';

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
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepository: Repository<FriendRequest>,
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(EventMedia)
    private readonly eventMediaRepository: Repository<EventMedia>,
    @InjectRepository(EventMetric)
    private readonly eventMetricRepository: Repository<EventMetric>,

    private readonly commentsService: CommentsService,
    private readonly genreService: GenresService,
    private readonly seriesService: SeriesService,
    private readonly moviesService: MoviesService,
    private readonly eventService: EventsService,
    private readonly resultsService: ResultsService,
    private readonly memberService: MembersService,
    private readonly voteService: VotesService,
    private readonly requestsService: RequestsService,
  ) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    this.logger.log('Deleting previous data...');

    await this.eventMetricRepository.query(
      'TRUNCATE TABLE "event_metrics" RESTART IDENTITY CASCADE',
    );
    await this.eventMediaRepository.query(
      'TRUNCATE TABLE "event_media" RESTART IDENTITY CASCADE',
    );
    await this.commentRepository.query(
      'TRUNCATE TABLE "comments" RESTART IDENTITY CASCADE',
    );
    await this.requestsRepository.query(
      'TRUNCATE TABLE "request" RESTART IDENTITY CASCADE',
    );
    await this.eventRepository.query(
      'TRUNCATE TABLE "events" RESTART IDENTITY CASCADE',
    );
    await this.membersRepository.query(
      'TRUNCATE TABLE "members" RESTART IDENTITY CASCADE',
    );
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

    this.logger.log('Data deleted successfully!');
    this.logger.log('Seeding database...');

    const defaultPassword = await bcrypt.hash('secure_password_1234', 10);
    const demoUsernames = [
      'carlos_dev',
      'laura_cine',
      'gamer_alex',
      'cinefilo_8',
      'maria_w',
      'anime_master',
      'david_film',
      'sara_pop',
    ];

    const extraUsers: User[] = demoUsernames.map((name, index) =>
      this.userRepository.create({
        id: index + 1,
        username: name,
        email: `${name}@watch.com`,
        password: defaultPassword,
        imagePath: `https://ui-avatars.com/api/?name=${name}&background=random`,
      }),
    );

    const allUsers = await this.userRepository.save(extraUsers);
    this.logger.log(`Inserted ${allUsers.length} demo users.`);

    if ((await this.genreRepository.count()) === 0) {
      this.logger.log('Fetching and storing TMDB genres...');
      await this.genreService.storeTmdbGenres();
    }

    const seriesTmdbIds = [1429, 105248, 114410, 94605, 1396, 46298];
    const moviesTmdbIds = [157336, 569094, 27205, 19995, 603, 550];

    const seededSeries: any[] = [];
    const seededMovies: any[] = [];

    this.logger.log(`Fetching ${seriesTmdbIds.length} TV series from TMDB...`);
    for (const id of seriesTmdbIds) {
      try {
        const series = await this.seriesService.findSeriesFromTmdbId(id);
        seededSeries.push(series);
        await sleep(400);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Failed to seed series ID: ${id}`,
          err.stack ?? String(error),
        );
      }
    }

    this.logger.log(`Fetching ${moviesTmdbIds.length} movies from TMDB...`);
    for (const id of moviesTmdbIds) {
      try {
        const movie = await this.moviesService.findMovieFromTmdbId(id);
        seededMovies.push(movie);
        await sleep(400);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Failed to seed movie ID: ${id}`,
          err.stack ?? String(error),
        );
      }
    }

    this.logger.log(
      `Total items loaded: ${seededSeries.length} series, ${seededMovies.length} movies.`,
    );
    this.logger.log('Creating demo events...');

    const hostUser1 = allUsers[0];
    const hostUser2 = allUsers[1];

    const animeVotingDto = new CreateVotingEventDto({
      name: 'Votación: Próximo Anime Maratón',
      description:
        '¿Qué series empezamos a ver juntos este fin de semana? ¡Vota tus favoritas!',
      eventDate: new Date(Date.now() + 86400000),
      maxMembers: 30,
      maxMedia: 2,
      maxVotesPerMember: 2,
      votingEndDate: new Date(Date.now() + 43200000),
      proposedMediaIds: [
        seededSeries[0].tmdbId,
        seededSeries[1].tmdbId,
        seededSeries[2].tmdbId,
        seededSeries[5].tmdbId,
      ],
      visibility: EventVisibility.PUBLIC,
    });

    const animeVotingEvent: VotingEvent =
      await this.eventService.createVotingEvent(animeVotingDto, hostUser1.id);

    const sciFiVotingDto = new CreateVotingEventDto({
      name: 'Cine Club: Joyas de Ciencia Ficción',
      description:
        'Noche de Nolan y universos paralelos. Elige la película ganadora.',
      eventDate: new Date(Date.now() + 172800000),
      maxMembers: 15,
      maxMedia: 1,
      maxVotesPerMember: 1,
      votingEndDate: new Date(Date.now() + 86400000),
      proposedMediaIds: [
        seededMovies[0].tmdbId,
        seededMovies[1].tmdbId,
        seededMovies[2].tmdbId,
        seededMovies[4].tmdbId,
      ],
      visibility: EventVisibility.PUBLIC,
    });

    const sciFiVotingEvent: VotingEvent =
      await this.eventService.createVotingEvent(sciFiVotingDto, hostUser2.id);

    const standardEventDto = new CreateStandardEventDto({
      name: 'Maratón Por Invitación: Breaking Bad',
      eventDate: new Date(Date.now() - 600000),
      maxMembers: 10,
      mediaIds: [seededSeries[4].tmdbId],
      visibility: EventVisibility.REQUEST_ONLY,
    });

    const standardEvent = await this.eventService.createStandardEvent(
      standardEventDto,
      hostUser1.id,
    );

    const festivalEventDto = new CreateStandardEventDto({
      name: 'Festival de Fin de Semana: Grandes Éxitos',
      eventDate: new Date(Date.now() + 518400000),
      maxMembers: 20,
      mediaIds: [
        seededSeries[3].tmdbId,
        seededMovies[3].tmdbId,
        seededMovies[5].tmdbId,
      ],
      visibility: EventVisibility.PUBLIC,
    });

    await this.eventService.createStandardEvent(festivalEventDto, hostUser2.id);
    this.logger.log('Events established successfully.');

    this.logger.log('Simulating event memberships...');
    const host1AnimeMember = await this.memberService.getByUserIdAndEventId(
      hostUser1.id,
      animeVotingEvent.id,
    );
    const host2SciFiMember = await this.memberService.getByUserIdAndEventId(
      hostUser2.id,
      sciFiVotingEvent.id,
    );

    const animeMembers: Member[] = [host1AnimeMember];
    const sciFiMembers: Member[] = [host2SciFiMember];

    for (const u of allUsers) {
      if (u.id !== hostUser1.id) {
        const am = this.membersRepository.create({
          user: u,
          event: animeVotingEvent,
        });
        animeMembers.push(await this.membersRepository.save(am));
      }

      if (u.id !== hostUser2.id && u.id % 2 === 0) {
        const sm = this.membersRepository.create({
          user: u,
          event: sciFiVotingEvent,
        });
        sciFiMembers.push(await this.membersRepository.save(sm));
      }

      if (u.id !== hostUser1.id && u.id < 5) {
        const stm = this.membersRepository.create({
          user: u,
          event: standardEvent,
        });
        await this.membersRepository.save(stm);
      }
    }

    this.logger.log('Simulating event live votes...');
    const animeVotesConfig = [
      {
        userId: allUsers[0].id,
        mediaIds: [seededSeries[0].tmdbId, seededSeries[1].tmdbId],
      },
      {
        userId: allUsers[1].id,
        mediaIds: [seededSeries[0].tmdbId, seededSeries[1].tmdbId],
      },
      {
        userId: allUsers[2].id,
        mediaIds: [seededSeries[0].tmdbId, seededSeries[2].tmdbId],
      },
      {
        userId: allUsers[3].id,
        mediaIds: [seededSeries[0].tmdbId, seededSeries[1].tmdbId],
      },
      {
        userId: allUsers[4].id,
        mediaIds: [seededSeries[1].tmdbId, seededSeries[2].tmdbId],
      },
    ];

    for (const config of animeVotesConfig) {
      for (const mId of config.mediaIds) {
        await this.voteService.createVote(
          new CreateVoteDto({ eventId: animeVotingEvent.id, mediaId: mId }),
          config.userId,
        );
      }
    }

    const sciFiVotesConfig = [
      { userId: allUsers[1].id, mediaId: seededMovies[0].tmdbId },
      { userId: allUsers[3].id, mediaId: seededMovies[0].tmdbId },
      { userId: allUsers[5].id, mediaId: seededMovies[0].tmdbId },
      { userId: allUsers[7].id, mediaId: seededMovies[2].tmdbId },
    ];

    for (const config of sciFiVotesConfig) {
      await this.voteService.createVote(
        new CreateVoteDto({
          eventId: sciFiVotingEvent.id,
          mediaId: config.mediaId,
        }),
        config.userId,
      );
    }

    this.logger.log('Simulating social graphs and notification system...');
    const activeFriendships = [
      { sender: allUsers[0], receiver: allUsers[1], accepted: true },
      { sender: allUsers[0], receiver: allUsers[2], accepted: true },
      { sender: allUsers[2], receiver: allUsers[3], accepted: true },
    ];

    for (const fs of activeFriendships) {
      const fRequest = this.friendRequestsRepository.create(fs);
      await this.friendRequestsRepository.save(fRequest);
    }

    await this.requestsService.createFriendRequest(
      allUsers[4].id,
      allUsers[0].id,
    );
    await this.requestsService.createFriendRequest(
      allUsers[5].id,
      allUsers[0].id,
    );
    await this.requestsService.createFriendRequest(
      allUsers[0].id,
      allUsers[7].id,
    );

    await this.requestsService.createEventInviteRequest(
      allUsers[1].id,
      new CreateEventInviteRequestDto({
        receiverId: allUsers[0].id,
        eventId: sciFiVotingEvent.id,
      }),
    );

    await this.requestsService.createEventInviteRequest(
      allUsers[2].id,
      new CreateEventInviteRequestDto({
        receiverId: allUsers[1].id,
        eventId: animeVotingEvent.id,
      }),
    );

    await this.requestsService.createEventAccessRequest(
      allUsers[3].id,
      standardEvent.id,
    );
    await this.requestsService.createEventAccessRequest(
      allUsers[4].id,
      standardEvent.id,
    );

    this.logger.log('Simulating live chat comments...');

    const commentsConfig = [
      {
        userId: allUsers[0].id,
        eventId: animeVotingEvent.id,
        message:
          '¡Esa escena inicial ha sido increíble! Qué locura de animación.',
      },
      {
        userId: allUsers[2].id,
        eventId: animeVotingEvent.id,
        message: 'La banda sonora en este combate te pone los pelos de punta.',
      },
      {
        userId: allUsers[5].id,
        eventId: animeVotingEvent.id,
        message:
          'Menudo giro argumental, no me esperaba para nada la traición de este personaje.',
      },
      {
        userId: allUsers[0].id,
        eventId: animeVotingEvent.id,
        message:
          'Aviso, la calidad del dibujo en este arco decae un poco, pero la historia compensa.',
      },
      {
        userId: allUsers[2].id,
        eventId: animeVotingEvent.id,
        message:
          'Qué brutalidad de coreografía, los movimientos de cámara son espectaculares.',
      },
      {
        userId: allUsers[5].id,
        eventId: animeVotingEvent.id,
        message:
          'Me he quedado helado con el final del episodio, vaya forma de cortar la trama.',
      },
      {
        userId: allUsers[0].id,
        eventId: animeVotingEvent.id,
        message:
          'Este capítulo adapta perfectamente el capítulo ochenta del manga, fidelidad absoluta.',
      },
      {
        userId: allUsers[3].id,
        eventId: animeVotingEvent.id,
        message:
          'La evolución psicológica del protagonista en estos tres episodios es una maravilla.',
      },
      {
        userId: allUsers[2].id,
        eventId: animeVotingEvent.id,
        message:
          'El diseño de los monstruos de esta temporada es mucho más tétrico que antes.',
      },
      {
        userId: allUsers[5].id,
        eventId: animeVotingEvent.id,
        message:
          'Los efectos de iluminación en los ataques mágicos se ven increíbles.',
      },
      {
        userId: allUsers[4].id,
        eventId: animeVotingEvent.id,
        message:
          'Vaya subtítulos más logrados, captan todos los juegos de palabras originales.',
      },
      {
        userId: allUsers[0].id,
        eventId: animeVotingEvent.id,
        message:
          'El actor de doblaje original se sale en este monólogo, transmite pura desesperación.',
      },
      {
        userId: allUsers[1].id,
        eventId: animeVotingEvent.id,
        message:
          'Ese plano secuencia cruzando la ciudad destruida es puro arte.',
      },
      {
        userId: allUsers[2].id,
        eventId: animeVotingEvent.id,
        message:
          'Hacía tiempo que un villano no me imponía tanto respeto como este.',
      },
      {
        userId: allUsers[4].id,
        eventId: animeVotingEvent.id,
        message:
          'La paleta de colores tan apagada le viene perfecta al tono trágico de la historia.',
      },
      {
        userId: allUsers[1].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Los efectos prácticos de los primeros minutos superan a cualquier diseño moderno.',
      },
      {
        userId: allUsers[3].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Qué pasada la ambientación opresiva de la nave, transmite claustrofobia pura.',
      },
      {
        userId: allUsers[1].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Esa mezcla de sonido analógico te mete de lleno en la tecnología de la época.',
      },
      {
        userId: allUsers[7].id,
        eventId: sciFiVotingEvent.id,
        message:
          'La banda sonora basada en sintetizadores es sencillamente espectacular.',
      },
      {
        userId: allUsers[3].id,
        eventId: sciFiVotingEvent.id,
        message:
          'El ritmo de la narración es pausado pero no te deja despegar los ojos.',
      },
      {
        userId: allUsers[5].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Qué fotografía tan impresionante, la iluminación de los pasillos es una obra de arte.',
      },
      {
        userId: allUsers[1].id,
        eventId: sciFiVotingEvent.id,
        message:
          'El trasfondo filosófico que plantea el guion da para analizarlo durante horas.',
      },
      {
        userId: allUsers[7].id,
        eventId: sciFiVotingEvent.id,
        message: 'Esa paradoja temporal me ha volado la cabeza por completo.',
      },
      {
        userId: allUsers[3].id,
        eventId: sciFiVotingEvent.id,
        message:
          'La actuación del androide es sublime, esa frialdad en la mirada da escalofríos.',
      },
      {
        userId: allUsers[1].id,
        eventId: sciFiVotingEvent.id,
        message:
          'El clímax final en el planeta desierto tiene una épica colosal.',
      },
      {
        userId: allUsers[5].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Es imposible no conmoverse con el discurso del astronauta antes de partir.',
      },
      {
        userId: allUsers[7].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Los planos del espacio exterior son poéticos, qué belleza de encuadres.',
      },
      {
        userId: allUsers[3].id,
        eventId: sciFiVotingEvent.id,
        message:
          'La metáfora sobre la soledad humana en el universo está brillantemente ejecutada.',
      },
      {
        userId: allUsers[1].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Vaya desenlace, deja un final abierto de esos que te hacen pensar toda la noche.',
      },
      {
        userId: allUsers[3].id,
        eventId: sciFiVotingEvent.id,
        message:
          'Increíble secuencia de créditos con esa melodía de piano tan melancólica.',
      },
    ];

    for (const commentData of commentsConfig) {
      await this.commentsService.create(
        commentData.userId,
        new CreateCommentDto({
          eventId: commentData.eventId,
          message: commentData.message,
        }),
      );
    }
    this.logger.log('Live event chat comments simulated successfully.');

    this.logger.log(
      'Closing voting periods via application logic to generate event_media rows...',
    );

    await this.resultsService.processVotingClosure(animeVotingEvent.id);
    await this.resultsService.processVotingClosure(sciFiVotingEvent.id);

    this.logger.log(
      'Moving historic events into the past database state via single table SQL...',
    );

    const pastEventDate1 = new Date(Date.now() - 172800000);
    const pastVotingEndDate1 = new Date(Date.now() - 259200000);
    const pastEndDate1 = new Date(
      pastEventDate1.getTime() + 2 * 60 * 60 * 1000,
    );
    const pastStartDate1 = new Date(pastEventDate1.getTime());

    const pastEventDate2 = new Date(Date.now() - 86400000);
    const pastVotingEndDate2 = new Date(Date.now() - 172800000);
    const pastEndDate2 = new Date(
      pastEventDate2.getTime() + 2 * 60 * 60 * 1000,
    );
    const pastStartDate2 = new Date(pastEventDate2.getTime());

    await this.commentRepository.query(
      `UPDATE "events" SET "eventDate" = $1, "votingEndDate" = $2, "endDate" = $4, "startDate" = $5, "status" = 'finished' WHERE "id" = $3`,
      [
        pastEventDate1,
        pastVotingEndDate1,
        animeVotingEvent.id,
        pastEndDate1,
        pastStartDate1,
      ],
    );

    await this.commentRepository.query(
      `UPDATE "events" SET "eventDate" = $1, "votingEndDate" = $2, "endDate" = $4, "startDate" = $5, "status" = 'finished' WHERE "id" = $3`,
      [
        pastEventDate2,
        pastVotingEndDate2,
        sciFiVotingEvent.id,
        pastEndDate2,
        pastStartDate2,
      ],
    );

    await this.membersRepository.query(
      `UPDATE "members" SET "hasJoined" = 'true' WHERE "eventId" IN ($1, $2)`,
      [animeVotingEvent.id, sciFiVotingEvent.id],
    );

    this.logger.log(
      'Generating snapshots histories via raw SQL for metrics dashboards...',
    );

    const simulatedEvents = [
      {
        id: animeVotingEvent.id,
        start: pastStartDate1,
        totalMessages: 15,
        maxViewers: 8,
      },
      {
        id: sciFiVotingEvent.id,
        start: pastStartDate2,
        totalMessages: 15,
        maxViewers: 5,
      },
    ];

    for (const sim of simulatedEvents) {
      let accumMessages = 0;
      for (let minute = 0; minute <= 3; minute++) {
        const snapshotTime = new Date(sim.start.getTime() + minute * 60000);
        const currentMessages =
          minute === 3
            ? sim.totalMessages - accumMessages
            : Math.floor(sim.totalMessages / 4);
        accumMessages += currentMessages;

        const currentViewers = Math.max(1, sim.maxViewers - (3 - minute));

        await this.eventMetricRepository.query(
          `INSERT INTO "event_metrics" ("eventId", "viewerCount", "messagesPerMinute", "accumulatedMessages", "createdAt") 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            sim.id,
            currentViewers,
            currentMessages,
            accumMessages,
            snapshotTime,
          ],
        );
      }
    }

    this.logger.log('Database seeded successfully!');
  }
}
