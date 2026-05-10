import { Module } from '@nestjs/common';
import { EventMediaService } from './event-media.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMedia } from './entities/event-media.entity';
import { EventMediaController } from './event-media.controller';
import { MembersModule } from 'src/members/members.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventMedia]), MembersModule],
  providers: [EventMediaService],
  exports: [EventMediaService],
  controllers: [EventMediaController],
})
export class EventMediaModule {}
