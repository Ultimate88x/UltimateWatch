import { Type } from 'class-transformer';
import { IsOptional, IsString, IsDate, IsNumber } from 'class-validator';

export class MediaFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  withGenres?: string;

  @IsOptional()
  @IsString()
  withoutGenres?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDateGreaterEqualThan?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDateLowerEqualThan?: Date;

  toString(): string {
    const parts: string[] = [];

    if (this.withGenres) parts.push(`withGenres: ${this.withGenres}`);
    if (this.withoutGenres) parts.push(`withoutGenres: ${this.withoutGenres}`);

    if (this.releaseDateGreaterEqualThan) {
      parts.push(
        `from: ${this.releaseDateGreaterEqualThan.toISOString().split('T')[0]}`,
      );
    }

    if (this.releaseDateLowerEqualThan) {
      parts.push(
        `to: ${this.releaseDateLowerEqualThan.toISOString().split('T')[0]}`,
      );
    }

    return parts.length > 0
      ? `MediaFilter(${parts.join(', ')})`
      : 'MediaFilter(no filters)';
  }
}
