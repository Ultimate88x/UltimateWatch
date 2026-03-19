import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Movie } from 'src/movies/entities/movie.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    await this.userRepository.query(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
    await this.movieRepository.query(
      'TRUNCATE TABLE "movies" RESTART IDENTITY CASCADE',
    );

    this.logger.log('Seeding database...');

    const testUser = this.userRepository.create({
      id: 1,
      username: 'admin',
      email: 'admin@watch.com',
      password: await bcrypt.hash('123456', 10),
      imagePath: 'https://ui-avatars.com/api/?name=admin&background=random',
    });

    await this.userRepository.save(testUser);
    this.logger.log('Database seeded successfully!');
  }
}
