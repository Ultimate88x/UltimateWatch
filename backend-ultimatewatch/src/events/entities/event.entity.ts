import { Media } from 'src/media/entities/media.entity';
import { Member } from 'src/members/entities/member.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';

@Entity('events')
export class Event extends BaseEntity {
  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  visibility: string;

  @Column({ type: 'date', nullable: true })
  eventDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null | undefined;

  @Column()
  timer: number = 0;

  @OneToMany(() => Member, (member) => member.event)
  member: Member[];

  @ManyToMany(() => Media, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'event_media',
    joinColumn: {
      name: 'eventId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'mediaId',
      referencedColumnName: 'id',
    },
  })
  media: Media[];
}
