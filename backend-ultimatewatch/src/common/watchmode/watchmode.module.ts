import { Module } from '@nestjs/common';
import { WatchmodeService } from './watchmode.service';
import { WatchmodeController } from './watchmode.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [WatchmodeController],
  providers: [WatchmodeService],
})
export class WatchmodeModule {}
