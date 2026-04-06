import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinDate,
  MinLength,
  Validate,
} from 'class-validator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { EventType } from 'src/common/enums/event.type.enum';
import { IsAfterDateConstraint } from 'src/common/validations/IsAfterDateConstraint';
import { Media } from 'src/media/entities/media.entity';
import { Member } from 'src/members/entities/member.entity';
import {
  Check,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  TableInheritance,
} from 'typeorm';

@Entity('events')
@TableInheritance({
  column: {
    type: 'enum',
    enum: EventType,
    name: 'type',
  },
})
@Check(`"endDate" IS NULL OR "endDate" > "eventDate"`)
export class Event extends BaseEntity {
  @Column()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @Column({ default: 'public' })
  @IsString()
  visibility: string;

  @Column({ type: 'timestamp' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(Date.now() + 60000))
  eventDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Validate(IsAfterDateConstraint, ['eventDate'])
  endDate?: Date | null;

  @Column({ default: 0 })
  @IsInt()
  timer: number;

  @IsEnum(EventType)
  type: EventType;

  @OneToMany(() => Member, (member) => member.event, {
    cascade: true,
  })
  members: Member[];

  @ManyToMany(() => Media, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'event_media',
    joinColumn: { name: 'eventId' },
    inverseJoinColumn: { name: 'mediaId' },
  })
  media?: Media[];
}
