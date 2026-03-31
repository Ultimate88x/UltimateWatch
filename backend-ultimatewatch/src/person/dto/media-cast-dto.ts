export class MediaCastDto {
  name: string;
  profilePath: string;
  character: string;

  constructor(init?: Partial<MediaCastDto>) {
    Object.assign(this, init);
  }
}
