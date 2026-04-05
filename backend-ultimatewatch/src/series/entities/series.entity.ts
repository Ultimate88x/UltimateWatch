import { MediaType } from 'src/common/enums/media.type.enum';
import { Media } from 'src/media/entities/media.entity';
import { Season } from 'src/seasons/entities/seasons.entity';
import { ChildEntity, Column, OneToMany } from 'typeorm';

@ChildEntity(MediaType.SERIES)
export class Series extends Media {
  @Column({ type: 'date', nullable: true })
  lastAirDate: Date | null | undefined;

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
