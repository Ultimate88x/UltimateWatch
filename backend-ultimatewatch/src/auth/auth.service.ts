import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/common/email/email.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

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
    private emailService: EmailService,
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
      return { userId: user?.id, username: user?.username } as SignInData;
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

  async signUp(input: CreateUserDto): Promise<AuthResult> {
    const user = await this.userService.create(input);

    return this.signIn({
      userId: user.id,
      username: user.username,
    } as SignInData);
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    if (user) {
      const token = Math.random().toString(36).substring(2);
      await this.userService.updateResetToken(user.id, token);

      await this.emailService.sendPasswordRecoveryEmail(
        user.email,
        user.username,
        token,
      );
    }

    return { message: 'If an account exists, a recovery email has been sent.' };
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    if (token === '') {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.userService.findByResetToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const now = new Date();
    if (user.resetTokenExpires && now > user.resetTokenExpires) {
      throw new UnauthorizedException('The reset link has expired');
    }

    return await this.userService.updatePassword(user.id, newPassword);
  }
}
