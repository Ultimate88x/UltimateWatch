import { BaseEntity } from 'src/common/entities/base.entity';
import { MediaContent } from 'src/media-contents/entities/media.content.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Provider } from './provider.entity';

@Entity('media_providers')
export class MediaProvider extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  link?: string | null;

  @ManyToOne(() => Provider, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  provider: Provider;

  @ManyToOne(() => MediaContent, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  mediaContent: MediaContent;
}
