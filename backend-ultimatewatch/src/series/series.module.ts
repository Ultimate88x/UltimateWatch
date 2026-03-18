import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { TmdbApiModule } from 'src/tmdbapi/tmdbapi.module';

@Module({
  imports: [TmdbApiModule],
  controllers: [SeriesController],
  providers: [SeriesService],
})
export class SeriesModule {}
