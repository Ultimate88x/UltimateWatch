import { RequestDto } from './request-dto';

export class RequestResponseDto {
  data: RequestDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<RequestResponseDto>) {
    Object.assign(this, init);
  }

  static empty(): RequestResponseDto {
    return new RequestResponseDto({
      data: [],
      total: 0,
      page: 1,
      lastPage: 1,
    });
  }
}
