import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';

@Module({
  imports: [TmdbApiModule],
  providers: [MoviesService],
  controllers: [MoviesController],
})
export class MoviesModule {}
