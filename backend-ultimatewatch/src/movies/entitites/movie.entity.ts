import { MediaContentEntity } from 'src/common/entities/media.content.entity';
import { Column, Entity } from 'typeorm';

@Entity('movies')
export class Movie extends MediaContentEntity {
  @Column()
  budget: number;

  @Column()
  runtime: number;

  @Column()
  revenue: number;

  @Column()
  releaseDate: Date;

  getReleaseDate(): Date {
    return this.releaseDate;
  }
}
