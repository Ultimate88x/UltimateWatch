import {
  IsNotEmpty,
  IsArray,
  Validate,
  ArrayMinSize,
  IsInt,
  ArrayMaxSize,
  IsBoolean,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { IsUniqueArrayConstraint } from 'src/common/validations/IsUniqueArrayConstraint';
import { CreateEventDto } from './create-event-dto';
import { RequiredIfConstraint } from 'src/common/validations/RequiredIfConstraint';

export class CreateStandardEventDto extends CreateEventDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'A standard event must have at least one media' })
  @ArrayMaxSize(20, {
    message: 'An event must have less or equal to 20 different media',
  })
  @IsInt({ each: true, message: 'Each media ID must be a number' })
  @Validate(IsUniqueArrayConstraint, ['Media List'])
  mediaIds: number[];

  @IsNotEmpty()
  @IsBoolean()
  isRecurring: boolean;

  @IsOptional()
  @IsInt()
  @Min(2, { message: 'Event needs to be recurring for at least two weeks' })
  @Max(12, { message: 'An event can be recurring for up to twelve weeks' })
  @Validate(RequiredIfConstraint, ['isRecurring', true])
  weeks?: number;

  constructor(init?: Partial<CreateStandardEventDto>) {
    super();
    Object.assign(this, init);
  }
}
