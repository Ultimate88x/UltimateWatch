import { Injectable } from '@nestjs/common';
import { ProductionCompany } from './entities/production-company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceNotFoundException } from 'src/common/exceptions/resource-not-found-exception';
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

  async findByTmdbId(tmdbId: number): Promise<ProductionCompany> {
    const productionCompany = await this.productionCompanyRepository.findOne({
      where: { tmdbId },
    });

    if (!productionCompany) {
      throw new ResourceNotFoundException(
        'Production Company',
        'TMDB_ID',
        String(tmdbId),
      );
    }

    return productionCompany;
  }

  async findOrCreate(
    tmdbId: number,
    productionCompany: ProductionCompany,
  ): Promise<ProductionCompany> {
    try {
      return await this.findByTmdbId(tmdbId);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        return await this.create(productionCompany);
      }

      throw error;
    }
  }
}
