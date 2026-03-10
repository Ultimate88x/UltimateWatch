import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ResourceNotOwnedException } from 'src/common/exceptions/resource-not-owned-exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newUser = await this.userRepository.save({
      ...dto,
      password: hashedPassword,
    });

    return newUser;
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, userId: number, updateUserDto: UpdateUserDto) {
    if (id !== userId) {
      throw new ResourceNotOwnedException('User');
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      return null;
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updateUserDto.password, salt);
      updateUserDto.password = hashedPassword;
    }

    const updatedUser = this.userRepository.merge(user, updateUserDto);

    return this.userRepository.save(updatedUser);
  }

  async remove(id: number, userId: number) {
    if (id !== userId) {
      throw new ResourceNotOwnedException('User');
    }

    await this.userRepository.delete(id);

    return { message: 'Account deleted successfully' };
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findByResetToken(resetToken: string) {
    return await this.userRepository.findOne({
      where: { resetToken },
    });
  }

  async updateResetToken(userId: number, token: string) {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    const result = await this.userRepository.update(userId, {
      resetToken: token,
      resetTokenExpires: expiryDate,
    });

    return result;
  }

  async updatePassword(userId: number, password: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.findOne(userId);

    if (!user) {
      return null;
    }

    const updatedUser = this.userRepository.merge(user, {
      password: hashedPassword,
    });

    return await this.userRepository.save(updatedUser);
  }
}
