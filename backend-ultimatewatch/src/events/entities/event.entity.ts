import { BaseEntity } from 'src/common/entities/base.entity';
import { Media } from 'src/media/entities/media.entity';
import { Member } from 'src/members/entities/member.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

@Entity('events')
export class Event extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null | undefined;

  @Column()
  visibility: string;

  @Column()
  eventDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date | null | undefined;

  @Column()
  timer: number = 0;

  @OneToMany(() => Member, (member) => member.event)
  members: Member[];

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
