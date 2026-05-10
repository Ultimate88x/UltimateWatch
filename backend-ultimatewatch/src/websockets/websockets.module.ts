import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CommentsModule } from 'src/comments/comments.module';
import { MembersModule } from 'src/members/members.module';
import { EventsModule } from 'src/events/events.module';
import { TimerGateway } from './timer.gateway';
import { EventMediaModule } from 'src/event-media/event-media.module';
import { EventMediaGateway } from './event-media.gateway';

@Module({
  imports: [CommentsModule, MembersModule, EventsModule, EventMediaModule],
  providers: [ChatGateway, TimerGateway, EventMediaGateway],
})
export class WebsocketsModule {}
