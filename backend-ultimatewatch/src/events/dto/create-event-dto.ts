import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsDate,
  MinDate,
} from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, {
    message: 'Event name must be at least 3 characters long',
  })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(Date.now() + 300000), {
    message: 'Event date must be at least five minutes after creation',
  })
  eventDate: Date;

  constructor(init?: Partial<CreateEventDto>) {
    Object.assign(this, init);
  }
}
