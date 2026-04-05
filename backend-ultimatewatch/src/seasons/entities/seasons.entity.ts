import { MediaType } from 'src/common/enums/media.type.enum';
import { Episode } from 'src/episodes/entities/episode.entity';
import { Media } from 'src/media/entities/media.entity';
import { Series } from 'src/series/entities/series.entity';
import { ChildEntity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@ChildEntity(MediaType.SEASON)
export class Season extends Media {
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
