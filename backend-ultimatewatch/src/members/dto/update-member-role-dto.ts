import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsEnum } from 'class-validator';
import { MemberRole } from 'src/common/enums/member.role.enum';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  targetUserId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  eventId: number;

  @IsNotEmpty()
  @IsEnum(MemberRole, {
    message: `Member role must be one of the following: ${Object.values(
      MemberRole,
    ).join(', ')}`,
  })
  role: MemberRole;

  constructor(init?: Partial<UpdateMemberRoleDto>) {
    Object.assign(this, init);
  }
}
