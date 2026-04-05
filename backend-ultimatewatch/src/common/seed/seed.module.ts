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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Media,
      Genre,
      ProductionCompany,
      Provider,
      Person,
    ]),
    GenresModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
