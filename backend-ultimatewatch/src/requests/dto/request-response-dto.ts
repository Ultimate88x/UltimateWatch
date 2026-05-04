export class RequestResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<RequestResponseDto<T>>) {
    Object.assign(this, init);
  }

  static empty(): RequestResponseDto<[]> {
    return new RequestResponseDto({
      data: [],
      total: 0,
      page: 1,
      lastPage: 1,
    });
  }
}
