import { PersonType } from 'src/common/enums/person.type.enum';
import { Media } from 'src/media/entities/media.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Person } from './person.entity';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('media_people')
@Unique(['person', 'media', 'character', 'job'])
export class MediaPerson extends BaseEntity {
  @Column({
    type: 'enum',
    enum: PersonType,
  })
  @Index()
  type: PersonType;

  @Column({ nullable: true })
  character?: string;

  @Column({ nullable: true })
  order?: number;

  @Column({ nullable: true })
  job?: string;

  @Column({ nullable: true })
  episodeCount?: number;

  @ManyToOne(() => Person, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  person: Person;

  @ManyToOne(() => Media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  media: Media;
}
