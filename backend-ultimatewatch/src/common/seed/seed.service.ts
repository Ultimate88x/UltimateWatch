import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Genre } from 'src/genres/entities/genre.entity';
import { GenresService } from 'src/genres/genres.service';
import { ProductionCompany } from 'src/production-companies/entities/production-company.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { Media } from 'src/media/entities/media.entity';
import { Person } from 'src/person/entities/person.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(ProductionCompany)
    private readonly productionCompanyRepository: Repository<ProductionCompany>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly genreService: GenresService,
  ) {}

  async onApplicationBootstrap() {
    await this.runSeed();
  }

  async runSeed() {
    this.logger.log('Deleting previous data...');

    await this.userRepository.query(
      'TRUNCATE TABLE "users" RESTART IDENTITY CASCADE',
    );
    await this.mediaRepository.query(
      'TRUNCATE TABLE "media" RESTART IDENTITY CASCADE',
    );
    await this.productionCompanyRepository.query(
      'TRUNCATE TABLE "production_companies" RESTART IDENTITY CASCADE',
    );
    await this.providerRepository.query(
      'TRUNCATE TABLE "providers" RESTART IDENTITY CASCADE',
    );
    await this.personRepository.query(
      'TRUNCATE TABLE "people" RESTART IDENTITY CASCADE',
    );
    await this.eventRepository.query(
      'TRUNCATE TABLE "events" RESTART IDENTITY CASCADE',
    );

    this.logger.log('Data deleted succesfully!');

    this.logger.log('Seeding database...');

    const testAdmin = this.userRepository.create({
      id: 1,
      username: 'admin',
      email: 'admin@watch.com',
      password: await bcrypt.hash('123456', 10),
      imagePath: 'https://ui-avatars.com/api/?name=admin&background=random',
    });

    const testUser = this.userRepository.create({
      id: 2,
      username: 'user',
      email: 'user@watch.com',
      password: await bcrypt.hash('123456', 10),
      imagePath: 'https://ui-avatars.com/api/?name=user&background=random',
    });

    await this.userRepository.save(testAdmin);
    await this.userRepository.save(testUser);

    if ((await this.genreRepository.count()) === 0) {
      await this.genreService.storeTmdbGenres();
    }

    this.logger.log('Database seeded successfully!');
  }
}
