import { Module } from '@nestjs/common';
import { WatchmodeService } from './watchmode.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [WatchmodeService],
  exports: [WatchmodeService],
})
export class WatchmodeModule {}
