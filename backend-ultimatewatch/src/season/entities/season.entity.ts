import { MediaEntity } from 'src/common/entities/media.entity';
import { Episode } from 'src/episode/entities/episode.entity';
import { Series } from 'src/series/entities/series.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('seasons')
export class Season extends MediaEntity {
  @Column()
  number: number;

  @Column({ type: 'date', nullable: true })
  uniqueLastRetrieved: Date | null | undefined;

  @ManyToOne(() => Series, (series) => series.seasons, { onDelete: 'CASCADE' })
  @JoinColumn()
  series: Series;

  @OneToMany(() => Episode, (episode) => episode.season)
  episodes: Episode[];

  getEpisodeNumber(): number {
    return this.episodes ? this.episodes.length : 0;
  }
}
