import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class TmdbEntity extends BaseEntity {
  @Index()
  @Column()
  tmdbId: number;
}
