import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { Column, Entity } from 'typeorm';

@Entity('production_companies')
export class ProductionCompany extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  logoPath: string;
}
