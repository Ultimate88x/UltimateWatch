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
    ]),
    GenresModule,
    SeriesModule,
    EventsModule,
    VotesModule,
    MembersModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
