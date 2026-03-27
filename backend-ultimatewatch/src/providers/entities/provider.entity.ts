import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { Column, Entity } from 'typeorm';

@Entity('providers')
export class Provider extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  logoPath: string;
}
