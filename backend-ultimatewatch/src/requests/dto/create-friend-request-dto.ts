import { IsNotEmpty, IsNumber, Validate } from 'class-validator';
import { IsNotEqualToConstraint } from 'src/common/validations/IsNotEqualToConstraint';

export class CreateFriendRequestDto {
  @IsNotEmpty()
  @IsNumber()
  senderId: number;

  @IsNotEmpty()
  @IsNumber()
  @Validate(IsNotEqualToConstraint, ['senderId', 'Sender', 'Receiver'])
  receiverId: number;
}
