import { BaseEntity } from 'src/common/entities/base.entity';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('movies')
export class Movie extends BaseEntity {
  @Column({ type: 'bigint', default: 0 })
  budget: number;

  @Column()
  runtime: number;

  @Column({ type: 'bigint', default: 0 })
  revenue: number;

  @OneToOne(() => MediaContent, (mediaContent) => mediaContent.movie, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn()
  mediaContent: MediaContent;
}
