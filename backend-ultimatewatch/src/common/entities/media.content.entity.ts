import { Column, JoinTable, ManyToMany } from 'typeorm';
import { MediaEntity } from './media.entity';
import { Genre } from 'src/genres/entities/genre.entity';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';

export abstract class MediaContentEntity extends MediaEntity {
  @Column()
  popularity: number;

  @Column()
  status: string;

  @ManyToMany(() => Genre)
  @JoinTable()
  genres: Genre[];

  @ManyToMany(() => ProductionCompany)
  @JoinTable()
  productionCompanies: ProductionCompany[];
}
