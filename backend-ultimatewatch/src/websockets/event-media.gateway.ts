import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateSortOrderDto } from 'src/event-media/dto/update-sort-order-dto';
import { EventMediaService } from 'src/event-media/event-media.service';
import { WebsocketExceptionFilter } from './websocket-exception.filter';

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(new WebsocketExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true }))
export class EventMediaGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly eventMediaService: EventMediaService) {}

  @SubscribeMessage('update-manifest')
  @UseGuards(AuthGuard)
  async handleUpdateManifest(
    @GetUser('userId') userId: number,
    @MessageBody() data: UpdateSortOrderDto,
  ) {
    await this.eventMediaService.updateSortOrder(userId, data);

    this.server
      .to(`event_${data.eventId}`)
      .emit('manifest-updated', data.items);
  }
}
