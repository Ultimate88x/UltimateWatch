import { EventType } from 'src/common/enums/event.type.enum';
import { Event } from './event.entity';
import { Check, ChildEntity, Column } from 'typeorm';
import { IsDate, IsInt, IsNotEmpty, Min, MinDate } from 'class-validator';
import { Type } from 'class-transformer';

@ChildEntity(EventType.VOTING)
@Check(`"eventDate" > "votingEndDate"`)
export class VotingEvent extends Event {
  @Column()
  @IsNotEmpty()
  @IsInt()
  @Min(2)
  maxMedia: number;

  @Column()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  maxVotesPerMember: number;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(Date.now() + 60000))
  votingEndDate: Date;
}
