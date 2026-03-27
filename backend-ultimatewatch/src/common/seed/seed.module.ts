import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../users/entities/user.entity';
import { Movie } from 'src/movies/entities/movie.entity';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresModule } from 'src/genres/genres.module';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { Provider } from 'src/providers/entities/provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Movie]),
    TypeOrmModule.forFeature([Genre]),
    TypeOrmModule.forFeature([ProductionCompany]),
    TypeOrmModule.forFeature([Provider]),
    GenresModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
