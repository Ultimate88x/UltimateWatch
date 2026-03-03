/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from 'src/users/users.service';

type AuthInput = {
  username: string;
  password: string;
};
type SignInData = {
  userId?: number;
  username?: string;
};
type AuthResult = {
  accessToken: string;
  userId: number;
  username: string;
};

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async authenticate(input: AuthInput): Promise<AuthResult> {
    const user = await this.validateUser(input);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return this.signIn(user);
  }

  async validateUser(input: AuthInput): Promise<SignInData | null> {
    const user = await this.userService.findByUsername(input.username);

    const isMatch = user
      ? await bcrypt.compare(input.password, user.password)
      : false;

    if (isMatch) {
      return { userId: user?.id, username: user?.username };
    }
    return null;
  }

  async signIn(user: SignInData): Promise<AuthResult> {
    if (!user.userId || !user.username) {
      throw new UnauthorizedException('Invalid user data');
    }

    const tokenPayload = { sub: user.userId, username: user.username };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return {
      accessToken,
      userId: user.userId,
      username: user.username,
    };
  }
}
