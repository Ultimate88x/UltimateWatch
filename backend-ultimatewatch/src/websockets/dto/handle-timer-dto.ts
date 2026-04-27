import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HandleTimerDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  eventId: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['start', 'pause', 'reset', 'update'])
  action: 'start' | 'pause' | 'reset' | 'update';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  value?: number;

  constructor(init?: Partial<HandleTimerDto>) {
    Object.assign(this, init);
  }
}
