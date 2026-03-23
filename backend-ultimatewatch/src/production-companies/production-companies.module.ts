import { Module } from '@nestjs/common';
import { ProductionCompaniesService } from './production-companies.service';
import { ProductionCompany } from './entities/production-company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionCompany])],
  providers: [ProductionCompaniesService],
  exports: [ProductionCompaniesService],
})
export class ProductionCompaniesModule {}
