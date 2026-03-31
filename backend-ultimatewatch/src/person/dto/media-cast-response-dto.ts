import { MediaCastDto } from './media-cast-dto';

export class MediaCastResponseDto {
  data: MediaCastDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<MediaCastResponseDto>) {
    Object.assign(this, init);
  }
}
