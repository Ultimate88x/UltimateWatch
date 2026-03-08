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

    return await this.userRepository.save({ id, ...updateUserDto });
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
}
