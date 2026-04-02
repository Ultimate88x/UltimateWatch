export class MediaCastDto {
  name: string;
  profilePath: string;
  character: string;
  episodeCount?: number;

  constructor(init?: Partial<MediaCastDto>) {
    Object.assign(this, init);
  }
}
