import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CommentsModule } from 'src/comments/comments.module';
import { MembersModule } from 'src/members/members.module';
import { EventsModule } from 'src/events/events.module';
import { TimerGateway } from './timer.gateway';

@Module({
  imports: [CommentsModule, MembersModule, EventsModule],
  providers: [ChatGateway, TimerGateway],
})
export class WebsocketsModule {}
