import { MediaCastResponseDto } from './media-cast-response-dto';
import { MediaCrewResponseDto } from './media-crew-response-dto';

export type MediaPeopleResponseDto = {
  cast: MediaCastResponseDto;
  crew: MediaCrewResponseDto;
};
