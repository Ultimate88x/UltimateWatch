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

  @OneToMany(() => Episode, (episode) => episode.season, { nullable: true })
  episodes: Episode[] | null;

  getEpisodesNumber(): number {
    return this.episodes ? this.episodes.length : 0;
  }
}
