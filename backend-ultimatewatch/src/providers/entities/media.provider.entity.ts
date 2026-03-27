import { BaseEntity } from 'src/common/entities/base.entity';
import { MediaContent } from 'src/media-contents/entities/media.content.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Provider } from './provider.entity';

@Entity('media_providers')
export class MediaProvider extends BaseEntity {
  @Column()
  link?: string;

  @ManyToOne(() => Provider)
  provider: Provider;

  @ManyToOne(() => MediaContent)
  mediaContent: MediaContent;
}
