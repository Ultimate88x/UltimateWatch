import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsDate,
  IsInt,
  Min,
  MinDate,
  IsArray,
  IsNumber,
  Validate,
} from 'class-validator';
import { CreateEventDto } from './create-event-dto';
import { IsUniqueArrayConstraint } from 'src/common/validations/IsUniqueArrayConstraint';

export class CreateVotingEventDto extends CreateEventDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'At least one media must end up selected' })
  maxMedia: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Event member should each get at least one vote' })
  maxVotesPerMember: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(Date.now() + 60000), {
    message: 'Voting period must last at least one minute',
  })
  votingEndDate: Date;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true, message: 'Each media ID must be a number' })
  @Validate(IsUniqueArrayConstraint, ['Proposed Media List'])
  proposedMediaIds: number[];
}
