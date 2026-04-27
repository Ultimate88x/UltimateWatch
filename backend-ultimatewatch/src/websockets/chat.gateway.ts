import { UseFilters, UseGuards } from '@nestjs/common';
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
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { MembersService } from 'src/members/members.service';
import { WebsocketExceptionFilter } from './websocket-exception.filter';
import { EventsService } from 'src/events/events.service';
import { Event } from 'src/events/entities/event.entity';
import { TimerDto } from './dto/timer-dto';

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(new WebsocketExceptionFilter())
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly commentsService: CommentsService,
    private readonly membersService: MembersService,
    private readonly eventsService: EventsService,
  ) {}

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

  @SubscribeMessage('joinEvent')
  @UseGuards(AuthGuard)
  async handleJoinEvent(
    @GetUser('userId') userId: number,
    @MessageBody('eventId') eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await this.membersService.getByUserIdAndEventId(userId, eventId);
    await client.join(`event_${eventId}`);

    const event: Event = await this.eventsService.findBydId(eventId);

    client.emit(
      'timer-update',
      new TimerDto({
        seconds: event.timer || 0,
        isActive: false,
      }),
    );
  }

  @SubscribeMessage('leaveEvent')
  @UseGuards(AuthGuard)
  async handleLeaveEvent(
    @MessageBody('eventId') eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`event_${eventId}`);
  }
}
