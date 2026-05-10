import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsDate,
  IsInt,
  Min,
  MinDate,
  IsArray,
  Validate,
  Max,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { CreateEventDto } from './create-event-dto';
import { IsUniqueArrayConstraint } from 'src/common/validations/IsUniqueArrayConstraint';
import { IsBeforeDateConstraint } from 'src/common/validations/IsBeforeDateConstraint';
import { IsLessOrEqualThanArrayLengthConstraint } from 'src/common/validations/IsLessOrEqualThanArrayLengthConstraint';
import { RequiredIfConstraint } from 'src/common/validations/RequiredIfConstraint';

export class CreateVotingEventDto extends CreateEventDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'At least one media must end up selected' })
  @Max(20, {
    message: 'An event must have less or equal to 20 different media',
  })
  maxMedia: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Event member should each get at least one vote' })
  @Validate(IsLessOrEqualThanArrayLengthConstraint, [
    'proposedMediaIds',
    'Proposed Media',
    'Votes per Member',
  ])
  maxVotesPerMember: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(Date.now() + 300000), {
    message: 'Voting period must last at least five minutes',
  })
  @Validate(IsBeforeDateConstraint, [
    'eventDate',
    'Event Start Date',
    'Voting End Date',
  ])
  votingEndDate: Date;

  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true, message: 'Each media ID must be an int' })
  @Validate(IsUniqueArrayConstraint, ['Proposed Media List'])
  proposedMediaIds: number[];

  @IsNotEmpty()
  @IsBoolean()
  isRecurring: boolean;

  @IsOptional()
  @IsInt()
  @Min(2, { message: 'Event needs to be recurring for at least two weeks' })
  @Max(12, { message: 'An event can be recurring for up to twelve weeks' })
  @Validate(RequiredIfConstraint, ['isRecurring', true])
  weeks?: number;

  constructor(init?: Partial<CreateVotingEventDto>) {
    super();
    Object.assign(this, init);
  }
}
