import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  imagePath: string;

  @Column({ nullable: true })
  imagePublicId: string;

  @Column({ nullable: true, select: false })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  resetTokenExpires: Date;
}
