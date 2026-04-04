import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ResourceNotOwnedException } from 'src/common/exceptions/resource-not-owned-exception';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
import { DuplicatedResourceException } from 'src/common/exceptions/duplicated-resource-exception';
import { UserDetailDto } from './dto/user-detail.dto';

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
      dto.password,
      salt,
    )) as unknown as string;

    const newUser = await this.userRepository.save({
      ...dto,
      password: hashedPassword,
    });

    return newUser;
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(id));
    }

    return user;
  }

  async getUserById(id: number): Promise<UserDetailDto> {
    const user = await this.findById(id);

    return this.createUserDetailDto(user);
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

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'password', 'imagePublicId'],
    });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(id));
    }

    await this.checkExistingUser(updateUserDto, id);

    if (updateUserDto.password) {
      const isMatch = user
        ? updateUserDto.oldPassword
          ? await bcrypt.compare(updateUserDto.oldPassword, user.password)
          : false
        : false;

      if (!isMatch) {
        throw new BadRequestException('Old password is incorrect');
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updateUserDto.password, salt);
      updateUserDto.password = hashedPassword;
    }

    if ((updateUserDto.imagePath === 'Delete' || file) && user?.imagePublicId) {
      await this.cloudinaryService.deleteImage(user?.imagePublicId);
      updateUserDto.imagePublicId = null;
    }

    if (file) {
      updateUserDto = await this.cloudinaryService.updateDtoImage(
        updateUserDto,
        file,
      );
    } else {
      updateUserDto.imagePath = updateUserDto.username
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(updateUserDto.username)}&background=6D28D9&color=fff`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=6D28D9&color=fff`;
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

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new ResourceNotFoundException('User', 'USERNAME', username);
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<UserDetailDto> {
    const user = await this.findByUsername(username);

    return this.createUserDetailDto({
      id: user.id,
      username: user.username,
      imagePath: user.imagePath,
    });
  }

  async getAllByUsername(username: string): Promise<UserDetailDto[]> {
    const users = await this.userRepository.find({
      where: {
        username: ILike(`%${username}%`),
      },
    });

    return users.map((user: User) =>
      this.createUserDetailDto({
        id: user.id,
        username: user.username,
        imagePath: user.imagePath,
      }),
    );
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ResourceNotFoundException('User', 'ID', String(userId));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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

  private createUserDetailDto(user: Partial<User>): UserDetailDto {
    return new UserDetailDto({
      id: user.id,
      username: user.username,
      email: user.email,
      imagePath: user.imagePath,
    });
  }
}
