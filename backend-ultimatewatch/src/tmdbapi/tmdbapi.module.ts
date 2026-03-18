import { Module } from '@nestjs/common';
import { TmdbApiService } from './tmdbapi.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [TmdbApiService],
  exports: [TmdbApiService],
})
export class TmdbapiModule {}
