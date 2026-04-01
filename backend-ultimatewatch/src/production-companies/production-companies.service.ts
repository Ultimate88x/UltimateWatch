import { Injectable } from '@nestjs/common';
import { ProductionCompany } from './entities/production-company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';

@Injectable()
export class ProductionCompaniesService {
  constructor(
    @InjectRepository(ProductionCompany)
    private readonly productionCompanyRepository: Repository<ProductionCompany>,
    private readonly tmdbApiService: TmdbApiService,
  ) {}

  async findByTmdbId(tmdbId: number): Promise<ProductionCompany> {
    const productionCompany = await this.productionCompanyRepository.findOne({
      where: { tmdbId },
    });

    if (!productionCompany) {
      throw new ResourceNotFoundException(
        'Production Company',
        'TMDB_ID',
        tmdbId.toString(),
      );
    }

    return productionCompany;
  }

  async upsert(
    productionCompany: ProductionCompany,
  ): Promise<ProductionCompany> {
    await this.productionCompanyRepository.upsert(productionCompany, [
      'tmdbId',
    ]);

    return await this.findByTmdbId(productionCompany.tmdbId);
  }

  async refreshTmdbProductionCompanies(limitDate: Date): Promise<number> {
    const storedCompanies = await this.productionCompanyRepository.find({
      where: { updatedAt: LessThan(limitDate) },
      select: ['tmdbId'],
    });

    const entitiesToUpdate: ProductionCompany[] = [];
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    for (const company of storedCompanies) {
      const freshData = await this.tmdbApiService.getProductionCompanyFromTmdb(
        company.tmdbId,
      );

      const productionCompany =
        TmdbApiMapper.tmdbProductionCompanyDtoToProductionCompany(freshData);
      entitiesToUpdate.push(productionCompany);

      await delay(200);
    }

    await this.productionCompanyRepository.upsert(entitiesToUpdate, ['tmdbId']);

    return entitiesToUpdate.length;
  }
}
