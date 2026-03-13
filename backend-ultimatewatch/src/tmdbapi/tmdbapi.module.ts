import { Module } from '@nestjs/common';
import { TmdbapiService } from './tmdbapi.service';

@Module({
  providers: [TmdbapiService]
})
export class TmdbapiModule {}
