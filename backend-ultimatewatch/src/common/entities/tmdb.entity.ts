import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class TmdbEntity extends BaseEntity {
  @Column()
  tmdbId: number;
}
