import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Event } from 'src/events/entities/event.entity';
import { Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Vote } from 'src/votes/entities/vote.entity';

@Entity('member')
export class Member extends BaseEntity {
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Event, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  event: Event;

  @OneToMany(() => Vote, (vote) => vote.member, { onDelete: 'CASCADE' })
  votes?: Vote[];
}
