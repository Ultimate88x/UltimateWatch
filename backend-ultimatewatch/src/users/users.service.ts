import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ResourceNotOwnedException } from 'src/common/exceptions/resource-not-owned-exception';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { DuplicatedResourceException } from 'src/common/exceptions/duplicated-resource-exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    await this.checkExistingUser(dto);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = (await bcrypt.hash(
      dto.password as string,
      salt,
    )) as unknown as string;

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
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(id));
    }

    return user;
  }

  async update(
    id: number,
    userId: number,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    if (id !== userId) {
      throw new ResourceNotOwnedException('User');
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(id));
    }

    await this.checkExistingUser(updateUserDto, id);

    if (user?.imagePublicId) {
      await this.cloudinaryService.deleteImage(user?.imagePublicId);
    }

    if (file) {
      updateUserDto = await this.cloudinaryService.updateDtoImage(
        updateUserDto,
        file,
      );
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

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(id));
    }

    if (user?.imagePublicId) {
      await this.cloudinaryService.deleteImage(user?.imagePublicId);
    }

    await this.userRepository.delete(id);

    return { message: 'Account deleted successfully' };
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new ResourceNotFoundException('User', 'USERNAME', username);
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    return user;
  }

  async findByResetToken(resetToken: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.resetTokenExpires')
      .where('user.resetToken = :resetToken', { resetToken })
      .getOne();

    if (!user) {
      throw new ResourceNotFoundException('User', 'RESET_TOKEN', resetToken);
    }

    return user;
  }

  async updateResetToken(userId: number, token: string) {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(userId));
    }

    const result = await this.userRepository.update(userId, {
      resetToken: token,
      resetTokenExpires: expiryDate,
    });

    return result;
  }

  async updatePassword(userId: number, password: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(userId));
    }

    const updatedUser = this.userRepository.merge(user, {
      password: hashedPassword,
    });

    return await this.userRepository.save(updatedUser);
  }

  async checkExistingUser(dto: Partial<CreateUserDto>, excludeUserId?: number) {
    if (dto.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: dto.username },
      });

      if (existingUser && existingUser.id !== excludeUserId) {
        throw new DuplicatedResourceException('user', 'username');
      }
    }

    if (dto.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingUser && existingUser.id !== excludeUserId) {
        throw new DuplicatedResourceException('user', 'email');
      }
    }
  }
}
