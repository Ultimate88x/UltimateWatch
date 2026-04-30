import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsDate,
  MinDate,
  IsInt,
  Max,
  Min,
  IsEnum,
} from 'class-validator';
import { EventVisibility } from 'src/common/enums/event.visibility.enum';

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

  @IsNotEmpty()
  @IsInt()
  @Min(2, { message: 'An event requires a minimum of 2 members' })
  @Max(50, { message: 'An event can have up to 50 members' })
  maxMembers: number;

  @IsNotEmpty()
  @IsEnum(EventVisibility, {
    message: `Visibility must be one of the following: ${Object.values(
      EventVisibility,
    ).join(', ')}`,
  })
  visibility: EventVisibility;

  constructor(init?: Partial<CreateEventDto>) {
    Object.assign(this, init);
  }
}
