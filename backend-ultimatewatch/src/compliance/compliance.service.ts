import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CronExpression } from '@nestjs/schedule/dist/enums/cron-expression.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { GenresService } from 'src/genres/genres.service';
import { Media } from 'src/media/entities/media.entity';
import { Person } from 'src/person/entities/person.entity';
import { ProductionCompaniesService } from 'src/production-companies/production-companies.service';
import { MediaProvider } from 'src/providers/entities/media.provider.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { Repository, LessThan } from 'typeorm';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(MediaProvider)
    private readonly mediaProviderRepository: Repository<MediaProvider>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Media)
    private readonly mediaContentRepository: Repository<Media>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly genresService: GenresService,
    private readonly productionCompaniesService: ProductionCompaniesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeObsoleteData() {
    this.logger.log(
      '-------------------- Initiating compliance data purge: Removing obsolete provider links and stale TMDB data. --------------------',
    );

    await this.purgeWatchmodeLinks();
    await this.purgeTmdbData();
    await this.purgePeopleData();
    await this.refreshTmdbData();

    this.logger.log(
      '-------------------- Compliance data purge completed: Obsolete provider links removed and stale TMDB data deleted and refreshed. --------------------',
    );
  }

  private async purgeWatchmodeLinks() {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 30);

    this.logger.log(
      `-------------------- Watchmode: Purging obsolete provider links. --------------------`,
    );

    const result = await this.mediaProviderRepository.update(
      { updatedAt: LessThan(limitDate) },
      { link: null },
    );

    this.logger.log(
      `-------------------- Watchmode:  Obsolete provider links cleared. ${result.affected} records updated. ---------------------`,
    );
  }

  private async purgeTmdbData() {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 60);

    this.logger.log(
      `-------------------- TMDB: Purging obsolete data. --------------------`,
    );

    const mediaResult = await this.mediaContentRepository.delete({
      updatedAt: LessThan(limitDate),
    });

    const providerResult = await this.providerRepository.delete({
      updatedAt: LessThan(limitDate),
    });

    this.logger.log(
      `-------------------- TMDB: Obsolete data purged. ${(mediaResult.affected || 0) + (providerResult.affected || 0)} records deleted. ---------------------`,
    );
  }

  private async purgePeopleData() {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 30);

    this.logger.log(
      `-------------------- TMDB: Purging obsolete People data. --------------------`,
    );

    const result = await this.personRepository.delete({
      updatedAt: LessThan(limitDate),
    });

    this.logger.log(
      `-------------------- TMDB: Obsolete People data purged. ${result.affected || 0} records deleted. ---------------------`,
    );
  }

  private async refreshTmdbData() {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 90);

    this.logger.log(
      `-------------------- TMDB: Refreshing obsolete data. --------------------`,
    );

    const genreResult = await this.genresService.storeTmdbGenres();

    const productionCompanyResult =
      await this.productionCompaniesService.refreshTmdbProductionCompanies(
        limitDate,
      );

    this.logger.log(
      `-------------------- TMDB: Obsolete data refreshed. ${genreResult + productionCompanyResult} records refreshed. ---------------------`,
    );
  }
}
