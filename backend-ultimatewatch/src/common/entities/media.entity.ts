import { Column } from 'typeorm';
import { TmdbEntity } from './tmdb.entity';

export abstract class MediaEntity extends TmdbEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  overview: string;

  @Column()
  imagePath: string;

  abstract getReleaseDate(): Date;
}
