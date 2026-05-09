import { Type } from 'class-transformer';
import { IsInt, Min, Max, Validate, IsDate, IsOptional } from 'class-validator';
import { IsBeforeDateConstraint } from 'src/common/validations/IsBeforeDateConstraint';
import { CreateEventDto } from './create-event-dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateVotingEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'At least one media must end up selected' })
  @Max(20, {
    message: 'An event must have less or equal to 20 different media',
  })
  maxMedia: number;

  @Type(() => Date)
  @IsDate()
  eventDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Validate(IsBeforeDateConstraint, [
    'eventDate',
    'Event Start Date',
    'Voting End Date',
  ])
  votingEndDate: Date;

  constructor(init?: Partial<UpdateVotingEventDto>) {
    super();
    Object.assign(this, init);
  }
}
