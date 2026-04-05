import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { UsersModule } from 'src/users/users.module';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), UsersModule, MediaModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
