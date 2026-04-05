import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  TableInheritance,
  Unique,
} from 'typeorm';
import { Genre } from 'src/genres/entities/genre.entity';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { MediaType } from 'src/common/enums/media.type.enum';

@Entity('media')
@TableInheritance({
  column: {
    type: 'enum',
    enum: MediaType,
    name: 'type',
  },
})
@Unique(['tmdbId'])
export class Media extends TmdbEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  overview: string;

  @Column()
  imagePath: string;

  @Column({ type: 'date', nullable: true })
  releaseDate: Date | null | undefined;

  @Column({ type: 'varchar', nullable: true })
  status?: string | undefined;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType;

  @ManyToMany(() => Genre, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'media_genres',
    joinColumn: {
      name: 'mediaId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'genreId',
      referencedColumnName: 'id',
    },
  })
  genres: Genre[];

  @ManyToMany(() => ProductionCompany, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'media_production_companies',
    joinColumn: {
      name: 'mediaId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'productionCompanyId',
      referencedColumnName: 'id',
    },
  })
  productionCompanies: ProductionCompany[];
}
