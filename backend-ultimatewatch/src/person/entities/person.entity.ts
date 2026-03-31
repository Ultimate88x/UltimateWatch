import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { Column, Entity } from 'typeorm';

@Entity('people')
export class Person extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  profilePath: string;
}
