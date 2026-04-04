import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, TableInheritance, ManyToOne, Check, Column } from 'typeorm';

@Entity()
@Check(`"senderId" <> "receiverId"`)
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Request extends BaseEntity {
  @Column()
  accepted: boolean = false;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User)
  receiver: User;
}
