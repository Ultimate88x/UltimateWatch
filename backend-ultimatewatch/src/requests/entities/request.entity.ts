import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, TableInheritance, ManyToOne, Column } from 'typeorm';

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export abstract class Request extends BaseEntity {
  @Column()
  accepted: boolean = false;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;
}
