import { BaseEntity } from 'src/common/entities/base.entity';
import { Media } from 'src/media/entities/media.entity';
import { Member } from 'src/members/entities/member.entity';
import { Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('votes')
export class Vote extends BaseEntity {
  @ManyToOne(() => Member, (member) => member.votes, { onDelete: 'CASCADE' })
  @JoinColumn()
  member: Member;

  @ManyToOne(() => Media, (media) => media.votes, { onDelete: 'CASCADE' })
  @JoinColumn()
  media: Media;
}
