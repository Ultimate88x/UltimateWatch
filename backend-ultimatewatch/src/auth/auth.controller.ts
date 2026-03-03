import {
  Controller,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
} from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login() {
    throw new NotImplementedException(
      'Login functionality is not implemented yet',
    );
  }
}
