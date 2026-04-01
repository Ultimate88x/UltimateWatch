import { BaseEntity } from 'src/common/entities/base.entity';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Provider } from './provider.entity';

@Entity('media_providers')
@Unique(['mediaContent', 'provider'])
export class MediaProvider extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  link?: string | null;

  @Column({ type: 'date', nullable: true })
  lastLinkUpdate: Date | null | undefined;

  @Column({ type: 'date', nullable: true })
  uniqueLastRetrieved: Date | null | undefined;

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
