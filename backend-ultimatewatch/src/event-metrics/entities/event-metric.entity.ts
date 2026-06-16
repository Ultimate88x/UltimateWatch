import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Event } from 'src/events/entities/event.entity';

@Entity('event_metrics')
export class EventMetric extends BaseEntity {
  @Column({ default: 0 })
  viewerCount: number;

  @Column({ default: 0 })
  messagesPerMinute: number;

  @Column({ default: 0 })
  accumulatedMessages: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn()
  event: Event;
}
