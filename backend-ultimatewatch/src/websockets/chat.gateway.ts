import { UseFilters, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CommentsService } from 'src/comments/comments.service';
import { ChatCommentDto } from 'src/comments/dto/chat-comment-dto';
import { CreateCommentDto } from 'src/comments/dto/create-comment-dto';
import { Comment } from 'src/comments/entities/comment.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { WebsocketExceptionFilter } from './websocket-exception.filter';

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(new WebsocketExceptionFilter())
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly commentsService: CommentsService) {}

  @SubscribeMessage('event-chat')
  @UseGuards(AuthGuard)
  async handleMessage(
    @GetUser('userId') userId: number,
    @MessageBody() commentDto: CreateCommentDto,
  ) {
    const savedComment: Comment = await this.commentsService.create(
      userId,
      commentDto,
    );

    const chatResponse = new ChatCommentDto({
      username: savedComment.member.user.username,
      userRole: savedComment.member.role,
      message: savedComment.message,
      createdAt: savedComment.createdAt,
    });

    this.server
      .to(`event_${commentDto.eventId}`)
      .emit('event-chat', chatResponse);
  }
}
