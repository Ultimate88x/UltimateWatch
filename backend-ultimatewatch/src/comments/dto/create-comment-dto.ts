import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  eventId: number;

  constructor(init?: Partial<CreateCommentDto>) {
    Object.assign(this, init);
  }
}
