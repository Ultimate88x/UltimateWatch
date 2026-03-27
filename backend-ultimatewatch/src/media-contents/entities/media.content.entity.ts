import { Column, Entity, JoinTable, ManyToMany, OneToOne } from 'typeorm';
import { MediaEntity } from '../../common/entities/media.entity';
import { Genre } from 'src/genres/entities/genre.entity';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { Movie } from 'src/movies/entities/movie.entity';

@Entity('media_contents')
export class MediaContent extends MediaEntity {
  @Column()
  popularity: number;

  @Column()
  status: string;

  @OneToOne(() => Movie, (movie) => movie.mediaContent)
  movie?: Movie;

  @ManyToMany(() => Genre, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'media_contents_genres',
    joinColumn: {
      name: 'mediaContentId',
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
    name: 'media_contents_production_companies',
    joinColumn: {
      name: 'mediaContentId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'productionCompanyId',
      referencedColumnName: 'id',
    },
  })
  productionCompanies: ProductionCompany[];

  getReleaseDate(): Date {
    return new Date();
  }
}
