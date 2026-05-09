import { EventType } from 'src/common/enums/event.type.enum';
import { Event } from './event.entity';
import {
  Check,
  ChildEntity,
  Column,
  Index,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { IsDate, IsInt, IsNotEmpty, Min, MinDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Media } from 'src/media/entities/media.entity';

@ChildEntity(EventType.VOTING)
@Check(`"eventDate" > "votingEndDate"`)
export class VotingEvent extends Event {
  @Column()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  maxMedia: number;

  @Column()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  maxVotesPerMember: number;

  @Index()
  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(Date.now() + 300000))
  votingEndDate: Date;

  @ManyToMany(() => Media, (media) => media.proposedInEvents, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'voting_event_proposed_media',
    joinColumn: { name: 'eventId' },
    inverseJoinColumn: { name: 'mediaId' },
  })
  proposedMedia: Media[];
}
