export class MediaCrewDto {
  name: string;
  profilePath: string;
  job: string;

  constructor(init?: Partial<MediaCrewDto>) {
    Object.assign(this, init);
  }
}
