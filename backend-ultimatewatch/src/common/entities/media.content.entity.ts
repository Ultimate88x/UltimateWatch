import { Column } from 'typeorm';
import { MediaEntity } from './media.entity';

export abstract class MediaContentEntity extends MediaEntity {
  @Column()
  popularity: number;

  @Column()
  status: string;
}
