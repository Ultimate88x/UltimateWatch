/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isWs = context.getType() === 'ws';
    let token: string;
    let clientReference: any;

    if (isWs) {
      clientReference = context.switchToWs().getClient();
      token =
        clientReference.handshake?.auth?.token ||
        clientReference.handshake?.headers?.authorization?.split(' ')[1];
    } else {
      clientReference = context.switchToHttp().getRequest();
      const authorization = clientReference.headers.authorization;
      token = authorization?.split(' ')[1];
    }

    if (!token) {
      this.throwException(isWs, 'Token not found');
    }

    try {
      const tokenPayload = await this.jwtService.verifyAsync(token);

      clientReference.user = {
        userId: tokenPayload.sub,
        username: tokenPayload.username,
      };

      return true;
    } catch (error) {
      this.throwException(isWs, (error as Error).message);
      return false;
    }
  }

  private throwException(isWs: boolean, message: string) {
    if (isWs) {
      throw new WsException(message);
    }
    throw new UnauthorizedException(message);
  }
}
