import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

type AuthInput = {
  username: string;
  password: string;
};
type SignInData = {
  userId: number;
  username: string;
};
type AuthResult = {
  accessToken: string;
  userId: number;
  username: string;
};

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return {
      accessToken: `token-for-user-${user.userId}`,
      userId: user.userId,
      username: user.username,
    };
  }

  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const user = await this.userService.findByUsername(input.username);

    if (user && user.password === input.password) {
      return { userId: user.id, username: user.username };
    }
    return null;
  }
}
