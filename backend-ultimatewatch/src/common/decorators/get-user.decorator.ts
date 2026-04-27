import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

type User = {
  userId: number;
  username: string;
};

interface SocketWithUser extends Socket {
  user: User;
}

export interface RequestWithUser extends Request {
  user: User;
}

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const contextType = ctx.getType();
    let user: User;

    if (contextType === 'ws') {
      const client = ctx.switchToWs().getClient<SocketWithUser>();
      user = client.user;
    } else {
      const request = ctx.switchToHttp().getRequest<RequestWithUser>();
      user = request.user;
    }

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
