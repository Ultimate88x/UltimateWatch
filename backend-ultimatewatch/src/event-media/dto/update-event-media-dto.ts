import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { EventMediaStatus } from 'src/common/enums/event.media.status.enum';

export class UpdateEventMediaDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  order: number;

  @IsNotEmpty()
  @IsEnum(EventMediaStatus, {
    message: `Media status must be one of the following: ${Object.values(
      EventMediaStatus,
    ).join(', ')}`,
  })
  status: EventMediaStatus;
}
