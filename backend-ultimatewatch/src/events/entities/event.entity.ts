import { BaseEntity, Column, Entity } from 'typeorm';

@Entity('events')
export class Event extends BaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  // @Column()
  // visibility :

  @Column({ type: 'date', nullable: true })
  eventDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null | undefined;

  @Column({ type: 'int', nullable: true })
  timer: number | null;
}
