import { Module } from '@nestjs/common';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';
import { MediaPerson } from './entities/media.person.entity';
import { MediaContentsModule } from 'src/media-contents/media-contents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Person, MediaPerson]),
    TmdbApiModule,
    MediaContentsModule,
  ],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService],
})
export class PersonModule {}
