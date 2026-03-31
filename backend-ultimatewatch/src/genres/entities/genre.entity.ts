import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { MediaType } from 'src/common/enums/media.type.enum';
import { Column, Entity, Unique } from 'typeorm';

@Entity('genres')
@Unique(['tmdbId', 'mediaType'])
export class Genre extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  mediaType: MediaType;
}
