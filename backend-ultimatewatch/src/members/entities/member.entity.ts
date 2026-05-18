import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Event } from 'src/events/entities/event.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { Vote } from 'src/votes/entities/vote.entity';
import { MemberRole } from 'src/common/enums/member.role.enum';
import { Comment } from 'src/comments/entities/comment.entity';

@Entity('members')
@Unique(['user', 'event'])
export class Member extends BaseEntity {
  @Column({ default: false })
  hasJoined: boolean;

  @Column({
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.MEMBER,
  })
  role: MemberRole;

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

  @OneToMany(() => Comment, (comment) => comment.member)
  comments?: Comment[];

  @OneToMany(() => Vote, (vote) => vote.member, { onDelete: 'CASCADE' })
  votes?: Vote[];
}
