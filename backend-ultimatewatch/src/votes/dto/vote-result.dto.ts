import { MediaType } from 'src/common/enums/media.type.enum';

export class VoteResultDto {
  id: number;
  title: string;
  imagePath: string;
  type: MediaType;
  count: number;
}
