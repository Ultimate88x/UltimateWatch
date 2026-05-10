import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateEventMediaDto } from './update-event-media-dto';

export class UpdateSortOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEventMediaDto)
  items: UpdateEventMediaDto[];
}
