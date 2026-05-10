import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateEventMediaDto } from './update-event-media-dto';

export class UpdateSortOrderDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  eventId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEventMediaDto)
  items: UpdateEventMediaDto[];
}
