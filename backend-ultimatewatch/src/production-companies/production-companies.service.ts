import { Injectable } from '@nestjs/common';
import { ProductionCompany } from './entities/production-company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TmdbApiService } from 'src/common/tmdbapi/tmdbapi.service';
import { TmdbApiMapper } from 'src/common/tmdbapi/mapper/tmdbapi-mapper';

@Injectable()
export class ProductionCompaniesService {
  constructor(
    @InjectRepository(ProductionCompany)
    private readonly productionCompanyRepository: Repository<ProductionCompany>,
    private readonly tmdbApiService: TmdbApiService,
  ) {}

  async create(
    productionCompany: ProductionCompany,
  ): Promise<ProductionCompany> {
    return await this.productionCompanyRepository.save(productionCompany);
  }

  async findByTmdbId(tmdbId: number): Promise<ProductionCompany | null> {
    const productionCompany = await this.productionCompanyRepository.findOne({
      where: { tmdbId },
    });

    return productionCompany;
  }

  async findOrCreate(
    tmdbId: number,
    productionCompany: ProductionCompany,
  ): Promise<ProductionCompany> {
    const existingCompany = await this.findByTmdbId(tmdbId);

    if (existingCompany) {
      return existingCompany;
    }

    return await this.create(productionCompany);
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
