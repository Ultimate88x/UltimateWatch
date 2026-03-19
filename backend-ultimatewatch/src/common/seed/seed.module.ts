import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../users/entities/user.entity';
import { Movie } from 'src/movies/entities/movie.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Movie]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
