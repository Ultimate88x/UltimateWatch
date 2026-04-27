import { ArgumentsHost, Catch, WsExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WebsocketExceptionFilter implements WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let errorResponse: any;

    if (exception instanceof WsException) {
      errorResponse = exception.getError();
    } else if (exception instanceof Error) {
      errorResponse = {
        status: 'error',
        message: exception.message,
      };
    } else {
      errorResponse = {
        status: 'error',
        message: 'An unknown error occurred',
      };
    }

    client.emit('exception', errorResponse);
  }
}
