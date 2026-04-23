import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CommentsModule } from 'src/comments/comments.module';

@Module({
  imports: [CommentsModule],
  providers: [ChatGateway],
})
export class WebsocketsModule {}
