import { Column, JoinTable, ManyToMany } from 'typeorm';
import { MediaEntity } from './media.entity';
import { Genre } from 'src/genres/entities/genre.entity';

export abstract class MediaContentEntity extends MediaEntity {
  @Column()
  popularity: number;

  @Column()
  status: string;

  @ManyToMany(() => Genre, { cascade: true })
  @JoinTable()
  genres: Genre[];
}
