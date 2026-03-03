/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    const count = await this.userRepository.count();

    if (count > 0) return;

    this.logger.log('Seeding database...');

    const testUser = this.userRepository.create({
      username: 'admin',
      email: 'admin@watch.com',
      password: await bcrypt.hash('123456', 10),
      imagePath: 'https://ui-avatars.com/api/?name=admin&background=random',
    });

    await this.userRepository.save(testUser);
    this.logger.log('Database seeded successfully!');
  }
}
