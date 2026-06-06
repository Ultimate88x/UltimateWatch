import { RequestDto } from './request-dto';

export class EventAccessRequestDto extends RequestDto {
  constructor(init?: Partial<EventAccessRequestDto>) {
    super();
    Object.assign(this, init);
  }
}
