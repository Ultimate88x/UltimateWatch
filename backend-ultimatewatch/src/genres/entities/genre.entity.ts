import { TmdbEntity } from 'src/common/entities/tmdb.entity';
import { MediaType } from 'src/common/enums/media.type.enum';
import { Column, Entity } from 'typeorm';

@Entity('genres')
export class Genre extends TmdbEntity {
  @Column()
  name: string;

  @Column()
  mediaType: MediaType;
}
