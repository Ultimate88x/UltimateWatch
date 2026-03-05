import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type User = {
  userId: number;
  username: string;
};

export interface RequestWithUser extends Request {
  user: User;
}

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
