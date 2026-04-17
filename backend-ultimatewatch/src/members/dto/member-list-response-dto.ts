import { MemberDetailDto } from './member-detail-dto';

export class MemberListResponseDto {
  data: MemberDetailDto[];
  total: number;
  page: number;
  lastPage: number;

  constructor(init?: Partial<MemberListResponseDto>) {
    Object.assign(this, init);
  }
}
