import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
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

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(new WebsocketExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true }))
export class EventGateway {
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

  @SubscribeMessage('leave-event')
  @UseGuards(AuthGuard)
  async handleLeaveEvent(
    @MessageBody('eventId') eventId: number,
    @ConnectedSocket() client: Socket,
  ) {
    await client.leave(`event_${eventId}`);
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
}
