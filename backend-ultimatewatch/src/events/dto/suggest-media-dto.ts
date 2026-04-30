import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class SuggestMediaDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  proposedMediaId: number;

  constructor(init?: Partial<SuggestMediaDto>) {
    Object.assign(this, init);
  }
}
