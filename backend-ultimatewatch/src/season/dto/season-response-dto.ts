import { SeasonDetailDto } from './season-detail-dto';

export class SeasonResponseDto {
  data: SeasonDetailDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<SeasonResponseDto>) {
    Object.assign(this, init);
  }

  static empty(): SeasonResponseDto {
    return new SeasonResponseDto({
      data: [],
      total: 0,
      page: 1,
      lastPage: 1,
    });
  }
}
