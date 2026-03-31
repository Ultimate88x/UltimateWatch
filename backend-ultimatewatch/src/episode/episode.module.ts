import { Module } from '@nestjs/common';
import { EpisodeService } from './episode.service';
import { EpisodeController } from './episode.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Episode } from './entities/episode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Episode])],
  controllers: [EpisodeController],
  providers: [EpisodeService],
})
export class EpisodeModule {}
