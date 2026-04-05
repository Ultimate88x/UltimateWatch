import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Event } from 'src/events/entities/event.entity';
import { Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('members')
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
}
