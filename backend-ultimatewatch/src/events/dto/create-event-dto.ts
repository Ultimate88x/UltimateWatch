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
  IsBoolean,
  Validate,
} from 'class-validator';
import { EventVisibility } from 'src/common/enums/event.visibility.enum';
import { RequiredIfConstraint } from 'src/common/validations/RequiredIfConstraint';

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
  @MinDate(() => new Date(Date.now() + 600000), {
    message: 'Event date must be at least ten minutes after creation',
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

  @IsNotEmpty()
  @IsBoolean()
  isRecurring: boolean;

  @IsOptional()
  @IsInt()
  @Min(2, { message: 'Event needs to be recurring for at least two weeks' })
  @Max(12, { message: 'An event can be recurring for up to twelve weeks' })
  @Validate(RequiredIfConstraint, ['isRecurring', true])
  weeks?: number;

  constructor(init?: Partial<CreateEventDto>) {
    Object.assign(this, init);
  }
}
