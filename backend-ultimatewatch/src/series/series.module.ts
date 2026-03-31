import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TmdbApiModule,
    CacheModule.register({
      ttl: 600000,
      max: 100,
    }),
  ],
  controllers: [SeriesController],
  providers: [SeriesService],
})
export class SeriesModule {}
