import { MediaType } from 'src/common/enums/media.type.enum';
import { SubMediaEventDto } from './sub-media-event-dto';

export class MediaEventDto {
  id: number;
  title: string;
  imagePath: string;
  type: MediaType;
  subMediaEvent?: SubMediaEventDto[] | null | undefined;

  constructor(init?: Partial<MediaEventDto>) {
    Object.assign(this, init);
  }
}
