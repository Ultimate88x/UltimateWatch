import { BaseEntity } from 'src/common/entities/base.entity';
import { MediaContentEntity } from 'src/common/entities/media.content.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Provider } from './provider.entity';

@Entity('media_providers')
export class MediaProvider extends BaseEntity {
  @Column()
  link?: string;

  @ManyToOne(() => Provider)
  provider: Provider;

  @ManyToOne(() => MediaContentEntity)
  mediaContent: MediaContentEntity;
}
