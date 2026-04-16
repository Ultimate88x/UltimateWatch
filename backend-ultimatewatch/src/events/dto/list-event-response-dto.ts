import { ListEventDto } from './list-event-dto';

export class ListEventResponseDto {
  data: ListEventDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<ListEventResponseDto>) {
    Object.assign(this, init);
  }
}
