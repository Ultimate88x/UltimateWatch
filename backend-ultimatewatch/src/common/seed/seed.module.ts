import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../users/entities/user.entity';
import { Movie } from 'src/movies/entities/movie.entity';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresModule } from 'src/genres/genres.module';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Movie]),
    TypeOrmModule.forFeature([Genre]),
    TypeOrmModule.forFeature([ProductionCompany]),
    GenresModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
