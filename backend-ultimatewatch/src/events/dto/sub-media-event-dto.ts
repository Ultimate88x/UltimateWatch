export class SubMediaEventDto {
  title: string;
  imagePath: string;
  type: string;

  constructor(init?: Partial<SubMediaEventDto>) {
    Object.assign(this, init);
  }
}
