import { Module } from '@nestjs/common';
import { EpisodeService } from './episode.service';
import { EpisodeController } from './episode.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Episode } from './entities/episode.entity';
import { SeasonModule } from 'src/season/season.module';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';

@Module({
  imports: [TypeOrmModule.forFeature([Episode]), SeasonModule, TmdbApiModule],
  controllers: [EpisodeController],
  providers: [EpisodeService],
})
export class EpisodeModule {}
