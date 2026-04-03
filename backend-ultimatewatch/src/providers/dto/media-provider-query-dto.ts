import { Type } from 'class-transformer';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class MediaProviderQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  mediaTmdbId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  providerTmdbId: number;
}
