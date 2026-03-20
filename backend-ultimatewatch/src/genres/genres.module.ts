import { Module } from '@nestjs/common';
import { GenresService } from './genres.service';
import { GenresController } from './genres.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';
import { Genre } from './entities/genre.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Genre]), TmdbApiModule],
  providers: [GenresService],
  controllers: [GenresController],
})
export class GenresModule {}
