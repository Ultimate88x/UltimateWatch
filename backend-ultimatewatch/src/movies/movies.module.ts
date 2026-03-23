import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { GenresModule } from 'src/genres/genres.module';
import { ProductionCompaniesModule } from 'src/production-companies/production-companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]),
    TmdbApiModule,
    GenresModule,
    ProductionCompaniesModule,
  ],
  providers: [MoviesService],
  controllers: [MoviesController],
})
export class MoviesModule {}
