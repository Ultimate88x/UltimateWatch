export class SubMediaEventDto {
  title: string;
  imagePath: string;

  constructor(init?: Partial<SubMediaEventDto>) {
    Object.assign(this, init);
  }
}
