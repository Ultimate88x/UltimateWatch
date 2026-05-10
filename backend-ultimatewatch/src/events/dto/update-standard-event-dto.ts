import { Type } from 'class-transformer';
import { CreateEventDto } from './create-event-dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDate, IsNotEmpty } from 'class-validator';

export class UpdateStandardEventDto extends PartialType(CreateEventDto) {
  @Type(() => Date)
  @IsDate()
  eventDate?: Date;

  @IsNotEmpty()
  @IsBoolean()
  updateAll: boolean;

  constructor(init?: Partial<UpdateStandardEventDto>) {
    super();
    Object.assign(this, init);
  }
}
