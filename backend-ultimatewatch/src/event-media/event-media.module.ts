import { Module } from '@nestjs/common';
import { EventMediaService } from './event-media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMedia } from './entities/event-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventMedia])],
  providers: [EventMediaService],
  exports: [EventMediaService],
})
export class EventMediaModule {}
