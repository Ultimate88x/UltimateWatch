import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from 'src/media/entities/media.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { GenresModule } from 'src/genres/genres.module';
import { ProductionCompaniesModule } from 'src/production-companies/production-companies.module';
import { MediaProvider } from 'src/providers/entities/media.provider.entity';
import { Person } from 'src/person/entities/person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, MediaProvider, Provider, Person]),
    GenresModule,
    ProductionCompaniesModule,
  ],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
