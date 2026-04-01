import { BaseEntity } from 'src/common/entities/base.entity';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';
import { Season } from 'src/seasons/entities/seasons.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

@Entity('series')
export class Series extends BaseEntity {
  @Column({ type: 'date', nullable: true })
  lastAirDate: Date | null | undefined;

  @OneToOne(() => MediaContent, (mediaContent) => mediaContent.series, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  @JoinColumn()
  mediaContent: MediaContent;

  @OneToMany(() => Season, (season) => season.series)
  seasons: Season[];

  getSeasonsNumber(): number {
    return this.seasons.length;
  }

  getEpisodesNumber(): number {
    return this.seasons.reduce((total: number, season: Season) => {
      return total + (season.getEpisodeNumber() || 0);
    }, 0);
  }
}
