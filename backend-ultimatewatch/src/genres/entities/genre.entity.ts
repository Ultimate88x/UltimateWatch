import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { Column, Entity } from 'typeorm';
import { MediaType } from '../../common/tmdbapi/enums/media.type.enum';

@Entity('genres')
export class Genre extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  mediaType: MediaType;
}
