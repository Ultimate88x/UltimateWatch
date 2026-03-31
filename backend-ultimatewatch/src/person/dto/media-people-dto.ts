import { MediaCastDto } from './media-cast-dto';
import { MediaCrewDto } from './media-crew-dto';

export type MediaPeopleResponseDto = {
  cast: MediaCastDto[];
  crew: MediaCrewDto[];
};
