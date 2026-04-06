import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class CreateVoteDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  eventId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  mediaId: number;
}
