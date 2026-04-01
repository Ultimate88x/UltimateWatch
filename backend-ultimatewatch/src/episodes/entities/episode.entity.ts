import { MediaEntity } from 'src/common/entities/media.entity';
import { Season } from 'src/seasons/entities/seasons.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('episodes')
export class Episode extends MediaEntity {
  @Column()
  number: number;

  @Column()
  type: string;

  @Column()
  runtime: number;

  @ManyToOne(() => Season, (season) => season.episodes, { onDelete: 'CASCADE' })
  @JoinColumn()
  season: Season;
}
