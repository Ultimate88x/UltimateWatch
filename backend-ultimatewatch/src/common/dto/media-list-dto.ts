import { TmdbListMediaDto } from '../tmdbapi/dto/media/tmdb-media-list-dto';

export class MediaListDto {
  mediaList: TmdbListMediaDto[];
  lastPage: boolean;

  constructor(init?: Partial<MediaListDto>) {
    Object.assign(this, init);
  }
}
