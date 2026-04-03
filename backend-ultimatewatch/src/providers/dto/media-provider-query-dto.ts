import { Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class MediaProviderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mediaTmdbId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  providerTmdbId: number;
}
