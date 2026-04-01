import { SeasonDetailDto } from 'src/seasons/dto/season-detail-dto';

export class EpisodeResponseDto {
  data: SeasonDetailDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<EpisodeResponseDto>) {
    Object.assign(this, init);
  }

  static empty(): EpisodeResponseDto {
    return new EpisodeResponseDto({
      data: [],
      total: 0,
      page: 1,
      lastPage: 1,
    });
  }
}
