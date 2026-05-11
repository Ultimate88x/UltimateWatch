import {
  BadRequestException,
  ForbiddenException,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { EventsService } from 'src/events/events.service';
import { MembersService } from 'src/members/members.service';
import { HandleTimerDto } from './dto/handle-timer-dto';
import { TimerDto } from './dto/timer-dto';
import { WebsocketExceptionFilter } from './websocket-exception.filter';
import { Member } from 'src/members/entities/member.entity';
import { MemberRole } from 'src/common/enums/member.role.enum';
import { EventStatus } from 'src/common/enums/event.status.enum';

interface TimerState {
  seconds: number;
  isActive: boolean;
  interval?: NodeJS.Timeout;
}

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(new WebsocketExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true }))
export class TimerGateway {
  @WebSocketServer()
  server: Server;

  private timers: Map<number, TimerState> = new Map();

  constructor(
    private readonly membersService: MembersService,
    private readonly eventsService: EventsService,
  ) {}

  @SubscribeMessage('timer-control')
  @UseGuards(AuthGuard)
  async handleTimerControl(
    @GetUser('userId') userId: number,
    @MessageBody() data: HandleTimerDto,
  ) {
    const { eventId, action, value } = data;

    const member: Member = await this.membersService.getByUserIdAndEventId(
      userId,
      eventId,
    );

    if (member.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only event owner can control the timer');
    }

    const event = await this.eventsService.findBydId(eventId);

    if (
      event.status === EventStatus.VOTING ||
      event.status === EventStatus.FINISHED
    ) {
      throw new BadRequestException(
        'You cannot modify the timer of a not started event',
      );
    }

    if (!this.timers.has(eventId)) {
      this.timers.set(eventId, { seconds: event.timer || 0, isActive: false });
    }

    const state = this.timers.get(eventId);

    if (!state) return;

    switch (action) {
      case 'start':
        if (!state.isActive) {
          state.interval = setInterval(() => {
            state.isActive = true;
            state.seconds++;
            this.broadcastTimer(eventId);

            if (state.seconds % 10 === 0) {
              this.eventsService
                .updateTimer(eventId, state.seconds)
                .catch((err: unknown) => {
                  const errorMessage =
                    err instanceof Error
                      ? err.message
                      : 'Unknown database error';

                  console.error(
                    `[Timer Save Error] Event ${eventId}: ${errorMessage}`,
                  );
                });
            }
          }, 1000);
        }
        break;

      case 'pause':
        state.isActive = false;
        if (state.interval) clearInterval(state.interval);
        await this.eventsService.updateTimer(eventId, state.seconds);
        break;

      case 'reset':
        state.seconds = 0;
        await this.eventsService.updateTimer(eventId, 0);
        break;

      case 'update':
        if (value) {
          state.seconds = Math.max(0, state.seconds + value);
          await this.eventsService.updateTimer(eventId, state.seconds);
        }
        break;
    }

    this.broadcastTimer(eventId);
  }

  private broadcastTimer(eventId: number) {
    const state = this.timers.get(eventId);
    if (state) {
      this.server.to(`event_${eventId}`).emit(
        'timer-update',
        new TimerDto({
          seconds: state.seconds,
          isActive: state.isActive,
        }),
      );
    }
  }
}
