import { Module } from '@nestjs/common';
import { ProductionCompaniesService } from './production-companies.service';
import { ProductionCompany } from './entities/production-company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionCompany]), TmdbApiModule],
  providers: [ProductionCompaniesService],
  exports: [ProductionCompaniesService],
})
export class ProductionCompaniesModule {}
