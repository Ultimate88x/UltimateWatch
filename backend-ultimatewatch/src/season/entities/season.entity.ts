import { MediaEntity } from 'src/common/entities/media.entity';
import { Episode } from 'src/episode/entities/episode.entity';
import { Series } from 'src/series/entities/series.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('seasons')
export class Season extends MediaEntity {
  @Column()
  number: number;

  @ManyToOne(() => Series, (series) => series.seasons, { onDelete: 'CASCADE' })
  @JoinColumn()
  series: Series;

  @OneToMany(() => Episode, (episode) => episode.season)
  episodes: Episode[];

  getEpisodesNumber(): number {
    return this.episodes.length;
  }
}
