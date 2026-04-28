import { IsNotEmpty, IsInt, IsArray, Validate } from 'class-validator';
import { IsUniqueArrayConstraint } from 'src/common/validations/IsUniqueArrayConstraint';

export class SuggestMediaDto {
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true, message: 'Each media ID must be an int' })
  @Validate(IsUniqueArrayConstraint, ['Proposed Media List'])
  proposedMediaIds: number[];

  constructor(init?: Partial<SuggestMediaDto>) {
    Object.assign(this, init);
  }
}
