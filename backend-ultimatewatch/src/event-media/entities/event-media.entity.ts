import { BaseEntity } from 'src/common/entities/base.entity';
import { EventMediaStatus } from 'src/common/enums/event.media.status.enum';
import { Event } from 'src/events/entities/event.entity';
import { Media } from 'src/media/entities/media.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('event_media')
export class EventMedia extends BaseEntity {
  @Column({
    type: 'enum',
    enum: EventMediaStatus,
    default: EventMediaStatus.PENDING,
  })
  status: EventMediaStatus;

  @Column({ type: 'timestamp', nullable: true })
  watchedAt: Date;

  @Column({ default: 0 })
  order: number;

  @ManyToOne(() => Event, (event) => event.media, { onDelete: 'CASCADE' })
  event: Event;

  @ManyToOne(() => Media, { onDelete: 'CASCADE' })
  media: Media;
}
