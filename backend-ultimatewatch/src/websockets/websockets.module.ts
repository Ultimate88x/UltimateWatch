import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CommentsModule } from 'src/comments/comments.module';
import { MembersModule } from 'src/members/members.module';

@Module({
  imports: [CommentsModule, MembersModule],
  providers: [ChatGateway],
})
export class WebsocketsModule {}
