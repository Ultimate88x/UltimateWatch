import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { Column, Entity } from 'typeorm';
import { Unique } from 'typeorm';

@Entity('production_companies')
@Unique(['tmdbId'])
export class ProductionCompany extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  logoPath: string;
}
