import { MediaType } from 'src/common/enums/media.type.enum';
import { Media } from 'src/media/entities/media.entity';
import { ChildEntity, Column } from 'typeorm';

@ChildEntity(MediaType.MOVIE)
export class Movie extends Media {
  @Column({ type: 'bigint', default: 0 })
  budget: number;

  @Column()
  runtime: number;

  @Column({ type: 'bigint', default: 0 })
  revenue: number;
}
