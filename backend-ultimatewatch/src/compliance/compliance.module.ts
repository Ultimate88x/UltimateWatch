import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaContent } from 'src/media-contents/entities/media-content.entity';
import { Provider } from 'src/providers/entities/provider.entity';
import { GenresModule } from 'src/genres/genres.module';
import { ProductionCompaniesModule } from 'src/production-companies/production-companies.module';
import { MediaProvider } from 'src/providers/entities/media.provider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaContent, MediaProvider, Provider]),
    GenresModule,
    ProductionCompaniesModule,
  ],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
