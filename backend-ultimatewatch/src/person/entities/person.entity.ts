import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity('people')
@Unique(['tmdbId'])
export class Person extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  profilePath: string;
}
