import { MediaCrewDto } from './media-crew-dto';

export class MediaCrewResponseDto {
  data: MediaCrewDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<MediaCrewResponseDto>) {
    Object.assign(this, init);
  }
}
