import { UserDetailDto } from './user-detail.dto';

export class UserResponseDto {
  data: UserDetailDto[];
  total: number;
  page: number;
  lastPage: boolean;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
