import { Module } from '@nestjs/common';
import { EpisodeService } from './episodes.service';
import { EpisodeController } from './episodes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Episode } from './entities/episode.entity';
import { SeasonModule } from 'src/seasons/seasons.module';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';

@Module({
  imports: [TypeOrmModule.forFeature([Episode]), SeasonModule, TmdbApiModule],
  controllers: [EpisodeController],
  providers: [EpisodeService],
})
export class EpisodeModule {}
