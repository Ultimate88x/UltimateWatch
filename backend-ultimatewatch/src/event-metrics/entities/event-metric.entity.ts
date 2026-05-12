import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Event } from 'src/events/entities/event.entity';

@Entity('event-metrics')
export class EventMetric extends BaseEntity {
  @Column()
  viewerCount: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn()
  event: Event;
}
