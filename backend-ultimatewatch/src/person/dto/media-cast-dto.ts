export class MediaCastDto {
  name: string;
  profilePath: string;
  character: string;
  order: number;

  constructor(init?: Partial<MediaCastDto>) {
    Object.assign(this, init);
  }
}
