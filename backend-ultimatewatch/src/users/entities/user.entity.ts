import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  Matches,
} from 'class-validator';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Column({ select: false })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/)
  password: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  imagePath: string;

  @Column({ type: 'varchar', nullable: true })
  imagePublicId: string | null;

  @Column({ nullable: true, select: false })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetTokenExpires: Date;
}
