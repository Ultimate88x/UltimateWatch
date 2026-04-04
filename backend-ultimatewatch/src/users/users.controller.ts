import {
  Controller,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserDetailDto } from './dto/user-detail.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:username')
  @UseGuards(AuthGuard)
  findByUsername(@Param('username') username: string): Promise<UserDetailDto> {
    return this.usersService.getUserByUsername(username);
  }

  @Get('search')
  @UseGuards(AuthGuard)
  findAllByUsername(
    @Query('username') username: string,
  ): Promise<UserDetailDto[]> {
    return this.usersService.getAllByUsername(username);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findById(@Param('id') id: string): Promise<UserDetailDto> {
    return this.usersService.getUserById(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @GetUser('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.update(+id, userId, updateUserDto, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @GetUser('userId') userId: number) {
    return this.usersService.remove(+id, userId);
  }
}
