import { Injectable } from '@nestjs/common';
import { ProductionCompany } from './entities/production-company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductionCompaniesService {
  constructor(
    @InjectRepository(ProductionCompany)
    private readonly productionCompanyRepository: Repository<ProductionCompany>,
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
}
