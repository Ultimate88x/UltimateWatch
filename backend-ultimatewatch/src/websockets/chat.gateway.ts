import { UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { CommentsService } from 'src/comments/comments.service';
import { ChatCommentDto } from 'src/comments/dto/chat-comment-dto';
import { CreateCommentDto } from 'src/comments/dto/create-comment-dto';
import { Comment } from 'src/comments/entities/comment.entity';

@WebSocketGateway({ cors: { origin: '*' } })
@UsePipes(new ValidationPipe())
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly commentsService: CommentsService) {}

  @SubscribeMessage('event-chat')
  async handleMessage(@MessageBody() commentDto: CreateCommentDto) {
    const savedComment: Comment = await this.commentsService.create(commentDto);

    const chatResponse = new ChatCommentDto({
      userId: savedComment.member.user.id,
      username: savedComment.member.user.username,
      userRole: savedComment.member.role,
      message: savedComment.message,
      createdAt: savedComment.createdAt,
    });

    this.server.to(`event_${commentDto.eventId}`).emit('comment', chatResponse);
  }

  @SubscribeMessage('joinEvent')
  async handleJoinEvent(
    @MessageBody() eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`event_${eventId}`);
  }

  @SubscribeMessage('leaveEvent')
  async handleLeaveEvent(
    @MessageBody() eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`event_${eventId}`);
  }
}
