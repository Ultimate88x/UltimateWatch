import { PersonType } from 'src/common/enums/person.type.enum';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Person } from './person.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('media_people')
export class MediaPerson extends BaseEntity {
  @Column()
  type: PersonType;

  @Column({ nullable: true })
  character?: string;

  @Column({ nullable: true })
  order?: number;

  @Column({ nullable: true })
  job?: string;

  @ManyToOne(() => Person, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  person: Person;

  @ManyToOne(() => MediaContent, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  mediaContent: MediaContent;
}
