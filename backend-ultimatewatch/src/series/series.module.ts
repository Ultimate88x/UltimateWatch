import { Module } from '@nestjs/common';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { TmdbApiModule } from 'src/common/tmdbapi/tmdbapi.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Series } from './entities/series.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenresModule } from 'src/genres/genres.module';
import { ProductionCompaniesModule } from 'src/production-companies/production-companies.module';
import { ProvidersModule } from 'src/providers/providers.module';
import { SeasonModule } from 'src/season/season.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Series]),
    TmdbApiModule,
    GenresModule,
    ProductionCompaniesModule,
    ProvidersModule,
    SeasonModule,
    CacheModule.register({
      ttl: 600000,
      max: 100,
    }),
  ],
  controllers: [SeriesController],
  providers: [SeriesService],
})
export class SeriesModule {}
