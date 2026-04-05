import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  MinLength,
  IsDate,
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
  eventDate: Date;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true, message: 'Each media ID must be a number' })
  mediaIds: number[];
}
