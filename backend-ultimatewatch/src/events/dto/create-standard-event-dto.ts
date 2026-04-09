import {
  IsNotEmpty,
  IsArray,
  Validate,
  ArrayMinSize,
  IsInt,
} from 'class-validator';
import { IsUniqueArrayConstraint } from 'src/common/validations/IsUniqueArrayConstraint';
import { CreateEventDto } from './create-event-dto';

export class CreateStandardEventDto extends CreateEventDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: 'A standard event must have at least one media' })
  @IsInt({ each: true, message: 'Each media ID must be a number' })
  @Validate(IsUniqueArrayConstraint, ['Media List'])
  mediaIds: number[];

  constructor(init?: Partial<CreateEventDto>) {
    super();
    Object.assign(this, init);
  }
}
