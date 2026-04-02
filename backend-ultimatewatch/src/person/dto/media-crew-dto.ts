export class MediaCrewDto {
  name: string;
  profilePath: string;
  job: string;
  episodeCount?: number;

  constructor(init?: Partial<MediaCrewDto>) {
    Object.assign(this, init);
  }
}
