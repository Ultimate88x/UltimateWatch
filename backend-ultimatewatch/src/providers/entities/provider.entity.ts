import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity('providers')
@Unique(['tmdbId'])
export class Provider extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  logoPath: string;
}
