import { MediaType } from 'src/common/enums/media.type.enum';
import { Media } from 'src/media/entities/media.entity';
import { Season } from 'src/seasons/entities/seasons.entity';
import { ChildEntity, Column, JoinColumn, ManyToOne } from 'typeorm';

@ChildEntity(MediaType.EPISODE)
export class Episode extends Media {
  @Column()
  number: number;

  @Column()
  episodeType: string;

  @Column()
  runtime: number;

  @ManyToOne(() => Season, (season) => season.episodes, { onDelete: 'CASCADE' })
  @JoinColumn()
  season: Season;
}
