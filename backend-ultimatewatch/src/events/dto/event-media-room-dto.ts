export class EventMediaRoomDto {
  id: number;
  tmdbId: number;
  title: string;
  imagePath: string;
  type: string;
  status: string;
  watchedAt: Date;
  order: number;

  constructor(init?: Partial<EventMediaRoomDto>) {
    Object.assign(this, init);
  }
}
