import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ResolveRequestDto {
  @IsBoolean({
    message: 'The accept field must be a boolean value (true/false)',
  })
  @IsNotEmpty({ message: 'The accept field is required' })
  accept: boolean;
}
