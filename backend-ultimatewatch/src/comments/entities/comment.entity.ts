import { IsNotEmpty, IsString } from 'class-validator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Event } from 'src/events/entities/event.entity';
import { Member } from 'src/members/entities/member.entity';
import { Column, JoinColumn, OneToMany } from 'typeorm';

export class Comment extends BaseEntity {
  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @OneToMany(() => Member, (member) => member.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  member: Member;

  @OneToMany(() => Event, (event) => event.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  event: Event;
}
