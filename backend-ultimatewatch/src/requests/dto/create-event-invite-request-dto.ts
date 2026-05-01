import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class CreateEventInviteRequestDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  receiverId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  eventId: number;

  constructor(init?: Partial<CreateEventInviteRequestDto>) {
    Object.assign(this, init);
  }
}
