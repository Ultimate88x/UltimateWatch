import { Module } from '@nestjs/common';
import { SeasonService } from './seasons.service';
import { SeasonController } from './seasons.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Season } from './entities/seasons.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Season])],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}
