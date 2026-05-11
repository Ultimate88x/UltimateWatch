import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class KickMemberDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  kickedUserId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  eventId: number;

  constructor(init?: Partial<KickMemberDto>) {
    Object.assign(this, init);
  }
}
