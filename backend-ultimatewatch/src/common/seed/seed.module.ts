import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../users/entities/user.entity';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresModule } from 'src/genres/genres.module';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { Media } from 'src/media/entities/media.entity';
import { Person } from 'src/person/entities/person.entity';
import { SeriesModule } from 'src/series/series.module';
import { EventsModule } from 'src/events/events.module';
import { VotesModule } from 'src/votes/votes.module';
import { Member } from 'src/members/entities/member.entity';
import { MembersModule } from 'src/members/members.module';
import { MoviesModule } from 'src/movies/movies.module';
import { Request } from 'src/requests/entities/request.entity';
import { FriendRequest } from 'src/requests/entities/friend-request.entity';
import { RequestsModule } from 'src/requests/requests.module';
import { Comment } from 'src/comments/entities/comment.entity';
import { CommentsModule } from 'src/comments/comments.module';
import { EventMedia } from 'src/event-media/entities/event-media.entity';
import { EventMediaModule } from 'src/event-media/event-media.module';
import { ResultsModule } from 'src/results/results.module';
import { EventMetric } from 'src/event-metrics/entities/event-metric.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Media,
      Genre,
      ProductionCompany,
      Provider,
      Person,
      Event,
      Member,
      Request,
      FriendRequest,
      Comment,
      EventMedia,
      EventMetric,
    ]),
    GenresModule,
    SeriesModule,
    MoviesModule,
    EventsModule,
    VotesModule,
    MembersModule,
    RequestsModule,
    CommentsModule,
    EventMediaModule,
    ResultsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
