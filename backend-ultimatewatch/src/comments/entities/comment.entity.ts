import { IsNotEmpty, IsString } from 'class-validator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Event } from 'src/events/entities/event.entity';
import { Member } from 'src/members/entities/member.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ManyToOne(() => Member, (member) => member.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  member: Member;
}
