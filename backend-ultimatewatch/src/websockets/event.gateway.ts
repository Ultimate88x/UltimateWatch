import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket, SocketData } from 'socket.io';
import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { WebsocketExceptionFilter } from './websocket-exception.filter';
import { EventsService } from 'src/events/events.service';
import { TimerDto } from './dto/timer-dto';
import { MembersService } from 'src/members/members.service';
import { Event } from 'src/events/entities/event.entity';
import { ChatCommentDto } from 'src/comments/dto/chat-comment-dto';
import { OnEvent } from '@nestjs/event-emitter';
import { KickMemberDto } from 'src/members/dto/kick-member-dto';
import { Member } from 'src/members/entities/member.entity';
import { UpdateMemberRoleDto } from 'src/members/dto/update-member-role-dto';
import { EventStatus } from 'src/common/enums/event.status.enum';

declare module 'socket.io' {
  interface SocketData {
    user?: { id: number };
  }
}

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(new WebsocketExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true }))
export class EventGateway {
  private readonly logger = new Logger(EventGateway.name);
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly eventsService: EventsService,
    private readonly membersService: MembersService,
  ) {}

  @SubscribeMessage('join-event')
  @UseGuards(AuthGuard)
  async handleJoinEvent(
    @GetUser('userId') userId: number,
    @MessageBody('eventId') eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const member: Member = await this.membersService.getByUserIdAndEventId(
      userId,
      eventId,
    );

    const roomName: string = `event_${eventId}`;
    await client.join(roomName);
    (client.data as SocketData).user = { id: userId };
    const event: Event = await this.eventsService.findBydId(eventId);

    if (event.status === EventStatus.STARTED) {
      const sockets = await this.server.in(roomName).fetchSockets();
      const currentMembersCount = sockets.length;

      this.eventsService
        .checkAndUpdatePeak(eventId, currentMembersCount)
        .catch((err) => {
          this.logger.error(
            `Error updating peak members for event ${eventId}: ${err}`,
          );
        });

      this.server.to(roomName).emit(
        'event-chat',
        new ChatCommentDto({
          username: 'SYSTEM',
          userRole: 'NOTICE',
          message: `${member.user.username} has joined the session.`,
          createdAt: new Date(),
        }),
      );

      client.emit(
        'timer-update',
        new TimerDto({
          seconds: event.timer || 0,
          isActive: false,
        }),
      );
    }
  }

  @SubscribeMessage('leave-event')
  @UseGuards(AuthGuard)
  async handleLeaveEvent(
    @GetUser('userId') userId: number,
    @MessageBody('eventId') eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const roomName: string = `event_${eventId}`;

    await client.leave(roomName);
    client.disconnect(true);

    const member: Member = await this.membersService.getByUserIdAndEventId(
      userId,
      eventId,
    );

    this.server.to(roomName).emit(
      'event-chat',
      new ChatCommentDto({
        username: 'SYSTEM',
        userRole: 'NOTICE',
        message: `${member.user.username} has left the session.`,
        createdAt: new Date(),
      }),
    );
  }

  @SubscribeMessage('start-event')
  @UseGuards(AuthGuard)
  async startEvent(
    @GetUser('userId') userId: number,
    @MessageBody('eventId') eventId: number,
  ) {
    const status: string = await this.eventsService.startEvent(userId, eventId);

    this.server.to(`event_${eventId}`).emit('event-status', status);
  }

  @SubscribeMessage('end-event')
  @UseGuards(AuthGuard)
  finishEvent(
    @GetUser('userId') userId: number,
    @MessageBody('eventId') eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const countdownNotice = new ChatCommentDto({
      username: 'SYSTEM',
      userRole: 'NOTICE',
      message:
        'The event will conclude in 10 seconds. Thank you for participating!',
      createdAt: new Date(),
    });
    this.server.to(`event_${eventId}`).emit('event-chat', countdownNotice);

    setTimeout(() => {
      void (async () => {
        try {
          const status = await this.eventsService.finishEvent(userId, eventId);

          this.server.to(`event_${eventId}`).emit('event-status', status);
        } catch (error) {
          client.emit('exception', {
            message:
              'Error closing event: ' +
              (error instanceof Error ? error.message : 'Unknown error'),
          });
        }
      })();
    }, 10000);
  }

  @OnEvent('member.kicked')
  async kickMember(payload: { kickMemberDto: KickMemberDto }) {
    const { kickedUserId, eventId } = payload.kickMemberDto;

    const roomName = `event_${eventId}`;

    const sockets = await this.server.in(roomName).fetchSockets();

    for (const socket of sockets) {
      const socketUserId = (socket.data as SocketData).user?.id;

      if (socketUserId === kickedUserId) {
        socket.emit('event-action', 'kicked');
      }
    }
  }

  @OnEvent('member.role-updated')
  async updateMemberRole(payload: {
    updateMemberRoleDto: UpdateMemberRoleDto;
  }) {
    const { targetUserId, eventId } = payload.updateMemberRoleDto;

    const roomName = `event_${eventId}`;

    const sockets = await this.server.in(roomName).fetchSockets();

    for (const socket of sockets) {
      const socketUserId = (socket.data as SocketData).user?.id;

      if (socketUserId === targetUserId) {
        socket.emit('event-action', 'role-updated');
      }
    }
  }
}
