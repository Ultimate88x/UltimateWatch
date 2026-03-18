import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { TmdbapiModule } from 'src/tmdbapi/tmdbapi.module';

@Module({
  imports: [TmdbapiModule],
  controllers: [SeriesController],
  providers: [SeriesService],
})
export class SeriesModule {}
